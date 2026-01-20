const {
  Product,
  Category,
  ProductImage,
  ProductRating,
  ProductFeature,
  ProductSize,
  ShippingRule,
} = require("../models");

const { Op, fn, col, literal } = require("sequelize");

/* ============================================================
   HELPERS
============================================================ */
function normalizeImage(img) {
  if (!img) return null;
  const fixed = String(img).replace(/\\/g, "/");
  return fixed.startsWith("/uploads") ? fixed : `/uploads/${fixed}`;
}

/* ============================================================
   DISABLE CACHE (CRITICAL FOR AUTO REFRESH)
============================================================ */
function noCache(res) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
}

/* ============================================================
   GET LATEST PRODUCTS FOR HOMEPAGE
============================================================ */
exports.getLatestProducts = async (req, res) => {
  try {
    noCache(res);

    const { slug } = req.params;
    const limit = Number(req.query.limit) || 6;

    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const products = await Product.findAll({
      where: { category_id: category.id },
      attributes: {
        include: [
          [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
          [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
        ],
      },
      include: [
        { model: ProductImage, attributes: ["image_url"], required: false },
        { model: ProductRating, attributes: [], required: false },
      ],
      group: ["Product.id", "ProductImages.id"],
      order: [["id", "DESC"]],
      limit,
      subQuery: false,
    });

    const formatted = products.map((p) => ({
      ...p.toJSON(),
      main_image: normalizeImage(p.ProductImages?.[0]?.image_url),
    }));

    return res.json({ success: true, products: formatted });
  } catch (err) {
    console.error("getLatestProducts ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load products" });
  }
};

/* ============================================================
   GET PRODUCTS BY CATEGORY SLUG
============================================================ */
exports.getProductsByCategorySlug = async (req, res) => {
  try {
    noCache(res);

    const { slug } = req.params;

    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const products = await Product.findAll({
      where: { category_id: category.id },
      attributes: {
        include: [
          [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
          [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
        ],
      },
      include: [
        { model: ProductImage, attributes: ["image_url"], required: false },
        { model: ProductRating, attributes: [], required: false },
      ],
      group: ["Product.id", "ProductImages.id"],
      order: [["id", "DESC"]],
      subQuery: false,
    });

    const formatted = products.map((p) => ({
      ...p.toJSON(),
      main_image: normalizeImage(p.ProductImages?.[0]?.image_url),
    }));

    return res.json({ success: true, products: formatted });
  } catch (err) {
    console.error("getProductsByCategorySlug ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load products" });
  }
};

/* ============================================================
   GET SINGLE PRODUCT DETAILS
============================================================ */
exports.getProductDetails = async (req, res) => {
  try {
    noCache(res);
    const { id } = req.params;
    console.log("Fetching product details for ID:", id);

    // 1. Fetch product (no aggregation, no group by, correct aliases, separate:true for hasMany)
    const product = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: "ProductImages", separate: true },
        { model: ProductFeature, as: "ProductFeatures", separate: true },
        { model: ProductSize, as: "ProductSizes", separate: true },
        { model: ShippingRule },
      ],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2. Fetch rating stats in a separate query
    let avg_rating = 0;
    let rating_count = 0;
    try {
      const ratingStats = await ProductRating.findOne({
        attributes: [
          [fn("COALESCE", fn("AVG", col("rating")), 0), "avg_rating"],
          [fn("COUNT", col("id")), "rating_count"],
        ],
        where: { product_id: id },
        raw: true,
      });
      avg_rating = Number(ratingStats.avg_rating) || 0;
      rating_count = Number(ratingStats.rating_count) || 0;
    } catch (err) {
      console.error("Error fetching rating stats for product", id, err);
      console.error(err.message);
      console.error(err.stack);
    }

    // 3. Attach rating data
    const prodJson = product.toJSON();
    prodJson.avg_rating = avg_rating;
    prodJson.rating_count = rating_count;

    // 4. Build response object (normalize images, safe arrays)
    return res.json({
      success: true,
      product: {
        id: prodJson.id,
        name: prodJson.name,
        price: prodJson.price,
        old_price: prodJson.old_price,
        stock: prodJson.stock ?? 0,
        description_short: prodJson.description_short || "",
        description_long: prodJson.description_long || "",
        tag: prodJson.tag,
        category_id: prodJson.category_id,
        avg_rating: prodJson.avg_rating,
        rating_count: prodJson.rating_count,
        images: Array.isArray(prodJson.ProductImages)
          ? prodJson.ProductImages.map((i) => normalizeImage(i.image_url))
          : [],
        features: Array.isArray(prodJson.ProductFeatures)
          ? prodJson.ProductFeatures.map((f) => f.feature_text)
          : [],
        sizes: Array.isArray(prodJson.ProductSizes)
          ? prodJson.ProductSizes.map((s) => s.size_text)
          : [],
        shipping: prodJson.ShippingRule
          ? {
              courier_charge: prodJson.ShippingRule.courier_charge,
              courier_desc: prodJson.ShippingRule.courier_desc,
              home_delivery_charge: prodJson.ShippingRule.home_delivery_charge,
              home_delivery_desc: prodJson.ShippingRule.home_delivery_desc,
              outside_valley_charge: prodJson.ShippingRule.outside_valley_charge,
              outside_valley_desc: prodJson.ShippingRule.outside_valley_desc,
            }
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    console.error(err.message);
    console.error(err.stack);
    return res.status(500).json({ success: false, message: "Failed to load product" });
  }
};

/* ============================================================
   GET ACTIVE EXCLUSIVE OFFERS (FIXED)
============================================================ */
exports.getExclusiveOffers = async (req, res) => {
  try {
    noCache(res);

    const products = await Product.findAll({
      where: {
        tag: "exclusive-offer",

        // ✅ must still be active
        exclusive_offer_end: {
          [Op.ne]: null,
          [Op.gt]: new Date(),
        },

        // ✅ old_price must exist
        old_price: { [Op.ne]: null },

        // ✅ old_price must be greater than price
        [Op.and]: literal(`old_price > price`),
      },
      attributes: {
        include: [
          [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
          [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
        ],
      },
      include: [
        { model: ProductImage, attributes: ["image_url"], required: false },
        { model: ProductRating, attributes: [], required: false },
      ],
      group: ["Product.id", "ProductImages.id"],
      order: [["exclusive_offer_end", "ASC"]],
      subQuery: false,
    });

    const formatted = products.map((p) => ({
      ...p.toJSON(),
      main_image: normalizeImage(p.ProductImages?.[0]?.image_url),
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("getExclusiveOffers ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch exclusive offers" });
  }
};

/* ============================================================
   🔔 SERVER-SENT EVENTS (AUTO REFRESH SUPPORT)
============================================================ */
let clients = [];

exports.productStream = (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
};

/* ============================================================
   🔔 CALL THIS AFTER ADMIN ADD / UPDATE PRODUCT
============================================================ */
exports.notifyProductUpdate = () => {
  clients.forEach((res) => {
    res.write(`event: product-update\ndata: updated\n\n`);
  });
};

/* ============================================================
   GET PRODUCT RECOMMENDATIONS
   - Same category + same tag first
   - Fallback to other tags in same category
   - For glasses/grocery (no tags), just get 3 from same category
   - Always exclude current product
   - Return max 3 products
============================================================ */
exports.getProductRecommendations = async (req, res) => {
  try {
    noCache(res);

    const { id } = req.params;
    const productId = Number(id);

    if (!productId) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Get current product to know its category and tag
    const currentProduct = await Product.findByPk(productId, {
      include: [{ model: Category, attributes: ["id", "slug"] }],
    });

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const categoryId = currentProduct.category_id;
    const categorySlug = currentProduct.Category?.slug;
    const productTag = currentProduct.tag;

    // For glasses and grocery, there are no tags, just fetch 6 products from same category
    const isSimpleCategory = categorySlug === "glasses" || categorySlug === "grocery";

    let recommendations = [];

    if (isSimpleCategory) {
      // Simple categories: just get 6 products from the same category (excluding current)
      recommendations = await Product.findAll({
        where: {
          category_id: categoryId,
          id: { [Op.ne]: productId },
        },
        attributes: {
          include: [
            [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
            [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
          ],
        },
        include: [
          { model: ProductImage, attributes: ["image_url"], required: false },
          { model: ProductRating, attributes: [], required: false },
        ],
        group: ["Product.id", "ProductImages.id"],
        order: [["id", "DESC"]],
        limit: 6,
        subQuery: false,
      });
    } else {
      // Complex categories (men, women, kids): prioritize same tag
      if (productTag) {
        // First try: same category + same tag
        recommendations = await Product.findAll({
          where: {
            category_id: categoryId,
            id: { [Op.ne]: productId },
            tag: productTag,
          },
          attributes: {
            include: [
              [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
              [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
            ],
          },
          include: [
            { model: ProductImage, attributes: ["image_url"], required: false },
            { model: ProductRating, attributes: [], required: false },
          ],
          group: ["Product.id", "ProductImages.id"],
          order: [["id", "DESC"]],
          limit: 6,
          subQuery: false,
        });
      }

      // If not enough, fill with other products from same category (different tags)
      if (recommendations.length < 6) {
        const existingIds = recommendations.map((p) => p.id);
        existingIds.push(productId);

        // Fallback order: new-arrival > best-selling > accessories > any
        const fallbackTags = ["new-arrival", "best-selling", "accessories"];
        
        for (const fallbackTag of fallbackTags) {
          if (recommendations.length >= 6) break;
          if (fallbackTag === productTag) continue; // Skip if same as original tag

          const additional = await Product.findAll({
            where: {
              category_id: categoryId,
              id: { [Op.notIn]: existingIds },
              tag: fallbackTag,
            },
            attributes: {
              include: [
                [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
                [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
              ],
            },
            include: [
              { model: ProductImage, attributes: ["image_url"], required: false },
              { model: ProductRating, attributes: [], required: false },
            ],
            group: ["Product.id", "ProductImages.id"],
            order: [["id", "DESC"]],
            limit: 6 - recommendations.length,
            subQuery: false,
          });

          recommendations = [...recommendations, ...additional];
          additional.forEach((p) => existingIds.push(p.id));
        }

        // If still not enough, get any remaining from same category
        if (recommendations.length < 6) {
          const additional = await Product.findAll({
            where: {
              category_id: categoryId,
              id: { [Op.notIn]: existingIds },
            },
            attributes: {
              include: [
                [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
                [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
              ],
            },
            include: [
              { model: ProductImage, attributes: ["image_url"], required: false },
              { model: ProductRating, attributes: [], required: false },
            ],
            group: ["Product.id", "ProductImages.id"],
            order: [["id", "DESC"]],
            limit: 6 - recommendations.length,
            subQuery: false,
          });

          recommendations = [...recommendations, ...additional];
        }
      }
    }

    // Format response
    const formatted = recommendations.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      old_price: p.old_price,
      tag: p.tag,
      avg_rating: Number(p.dataValues.avg_rating) || 0,
      rating_count: Number(p.dataValues.rating_count) || 0,
      main_image: normalizeImage(p.ProductImages?.[0]?.image_url),
    }));

    return res.json({ success: true, recommendations: formatted, categorySlug });
  } catch (err) {
    console.error("getProductRecommendations ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to load recommendations" });
  }
};
