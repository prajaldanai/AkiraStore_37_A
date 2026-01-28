/**
 * Product Search Service
 * Database logic for searching products
 */

const { Op, fn, col, literal } = require("sequelize");
const { Product, Category, ProductImage } = require("../../models");

/**
 * Search products by keyword
 * @param {string} query - Search keyword
 * @param {string} type - "quick" (6 results) or "full" (all results)
 * @returns {Promise<Object>} - { query, totalResults, results }
 */
async function searchProducts(query, type = "quick") {
  try {
    const searchTerm = query.trim().toLowerCase();
    const limit = type === "quick" ? 6 : 100;

    // Build search conditions
    const whereClause = {
      [Op.or]: [
        // Product name contains search term (case-insensitive)
        literal(`LOWER("Product"."name") LIKE '%${searchTerm.replace(/'/g, "''")}%'`),
      ],
    };

    // Get products with category and images
    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
        {
          model: ProductImage,
          attributes: ["image_url"],
          limit: 1,
        },
      ],
      attributes: [
        "id",
        "name",
        "price",
        "old_price",
        "stock",
      ],
      order: [
        // Exact matches first (name starts with search term)
        [literal(`CASE WHEN LOWER("Product"."name") LIKE '${searchTerm.replace(/'/g, "''")}%' THEN 0 ELSE 1 END`), "ASC"],
        // Then by relevance (name contains search term)
        [literal(`POSITION('${searchTerm.replace(/'/g, "''")}' IN LOWER("Product"."name"))`), "ASC"],
      ],
      limit,
    });

    // Also search by category name
    const categoryProducts = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
          where: literal(`LOWER("Category"."name") LIKE '%${searchTerm.replace(/'/g, "''")}%'`),
        },
        {
          model: ProductImage,
          attributes: ["image_url"],
          limit: 1,
        },
      ],
      attributes: [
        "id",
        "name",
        "price",
        "old_price",
        "stock",
      ],
      limit,
    });

    // Merge and deduplicate results
    const allProducts = [...products];
    const productIds = new Set(products.map(p => p.id));
    
    categoryProducts.forEach(product => {
      if (!productIds.has(product.id)) {
        allProducts.push(product);
        productIds.add(product.id);
      }
    });

    // Format results
    const results = allProducts.slice(0, limit).map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      oldPrice: product.old_price ? parseFloat(product.old_price) : null,
      image: product.ProductImages?.[0]?.image_url || null,
      category: product.Category?.name || "Uncategorized",
      categorySlug: product.Category?.slug || null,
      stock: parseInt(product.stock) || 0,
    }));

    // Get total count for full search
    let totalResults = results.length;
    if (type === "full") {
      const count = await Product.count({
        where: whereClause,
      });
      totalResults = count;
    }

    return {
      query: query,
      totalResults,
      results,
    };
  } catch (error) {
    console.error("searchProducts error:", error);
    throw error;
  }
}

/**
 * Get popular/suggested products
 * @returns {Promise<Array>}
 */
async function getSuggestedProducts() {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
        {
          model: ProductImage,
          attributes: ["image_url"],
          limit: 1,
        },
      ],
      attributes: [
        "id",
        "name",
        "price",
        "stock",
      ],
      order: [["id", "DESC"]],
      limit: 4,
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      image: product.ProductImages?.[0]?.image_url || null,
      category: product.Category?.name || "Uncategorized",
      stock: parseInt(product.stock) || 0,
    }));
  } catch (error) {
    console.error("getSuggestedProducts error:", error);
    throw error;
  }
}

/**
 * Search products by image
 * Returns all products with images for visual matching
 * In production, you'd use AI/ML for image similarity
 * @param {string} categoryHint - Optional category filter from image analysis
 * @returns {Promise<Object>}
 */
async function searchByImage(categoryHint = null) {
  try {
    const whereClause = {};
    const categoryWhere = {};

    // If we have a category hint (e.g., from image analysis), filter by it
    if (categoryHint) {
      categoryWhere.name = { [Op.iLike]: `%${categoryHint}%` };
    }

    // Get products with images
    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
          where: Object.keys(categoryWhere).length > 0 ? categoryWhere : undefined,
          required: Object.keys(categoryWhere).length > 0,
        },
        {
          model: ProductImage,
          attributes: ["image_url"],
          required: true, // Only products with images
        },
      ],
      attributes: [
        "id",
        "name",
        "price",
        "old_price",
        "stock",
      ],
      order: [["id", "DESC"]],
      // No limit - need to check all products for image matching
    });

    const results = products.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      oldPrice: product.old_price ? parseFloat(product.old_price) : null,
      image: product.ProductImages?.[0]?.image_url || null,
      // Include ALL images for hash comparison
      allImages: product.ProductImages?.map(img => img.image_url) || [],
      category: product.Category?.name || "Uncategorized",
      categorySlug: product.Category?.slug || null,
      stock: parseInt(product.stock) || 0,
    }));

    return {
      query: "Image Search",
      totalResults: results.length,
      results,
      searchType: "image",
    };
  } catch (error) {
    console.error("searchByImage error:", error);
    throw error;
  }
}

module.exports = {
  searchProducts,
  getSuggestedProducts,
  searchByImage,
};
