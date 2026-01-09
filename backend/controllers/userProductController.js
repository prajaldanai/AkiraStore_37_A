const {
  Product,
  Category,
  ProductImage,
  ProductRating,
} = require("../models");
const { Op, fn, col, literal } = require("sequelize");

/* ============================================================
   HELPER
============================================================ */
function normalizeImage(img) {
  if (!img) return null;
  const fixed = String(img).replace(/\\/g, "/");
  return fixed.startsWith("/uploads") ? fixed : `/uploads/${fixed}`;
}

/* ============================================================
   GET LATEST PRODUCTS FOR HOMEPAGE
============================================================ */
exports.getLatestProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = Number(req.query.limit) || 6;

    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
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
        {
          model: ProductImage,
          attributes: ["image_url"],
          required: false, // ✅ IMPORTANT
        },
        {
          model: ProductRating,
          attributes: [],
          required: false, // ✅ IMPORTANT
        },
      ],
      group: ["Product.id", "ProductImages.id"],
      order: [["id", "DESC"]], // ✅ avoid created_at issues
      limit,
      subQuery: false,
    });

    const formatted = products.map((p) => {
      const mainImage = p.ProductImages?.[0]?.image_url || null;

      return {
        ...p.toJSON(),
        main_image: normalizeImage(mainImage),
      };
    });

    return res.json({ success: true, products: formatted });
  } catch (err) {
    console.error("❌ getLatestProducts ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load latest products",
    });
  }
};

/* ============================================================
   GET ALL PRODUCTS BY CATEGORY SLUG
============================================================ */
exports.getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
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
        {
          model: ProductImage,
          attributes: ["image_url"],
          required: false,
        },
        {
          model: ProductRating,
          attributes: [],
          required: false,
        },
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
    console.error("❌ getProductsByCategorySlug ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load category products",
    });
  }
};

/* ============================================================
   GET SINGLE PRODUCT DETAILS PAGE
============================================================ */
exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      attributes: {
        include: [
          [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
          [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
        ],
      },
      include: [
        {
          model: ProductImage,
          attributes: ["image_url"],
          required: false,
        },
        {
          model: ProductRating,
          attributes: [],
          required: false,
        },
      ],
      group: ["Product.id", "ProductImages.id"],
      subQuery: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product: {
        ...product.toJSON(),
        images: (product.ProductImages || []).map((i) =>
          normalizeImage(i.image_url)
        ),
      },
    });
  } catch (err) {
    console.error("❌ getProductDetails ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load product details",
    });
  }
};

/* ============================================================
   GET ACTIVE EXCLUSIVE OFFERS
============================================================ */
exports.getExclusiveOffers = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        tag: "exclusive-offer",
        exclusive_offer_end: {
          [Op.ne]: null, // ✅ prevent NULL crash
          [Op.gt]: new Date(),
        },
      },
      attributes: {
        include: [
          [fn("COALESCE", fn("AVG", col("ProductRatings.rating")), 0), "avg_rating"],
          [fn("COUNT", col("ProductRatings.rating")), "rating_count"],
        ],
      },
      include: [
        {
          model: ProductImage,
          attributes: ["image_url"],
          required: false,
        },
        {
          model: ProductRating,
          attributes: [],
          required: false,
        },
      ],
      group: ["Product.id", "ProductImages.id"],
      order: [["exclusive_offer_end", "ASC"]],
      subQuery: false,
    });

    const formatted = products.map((p) => ({
      ...p.toJSON(),
      main_image: normalizeImage(p.ProductImages?.[0]?.image_url),
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Exclusive offers error:", error);
    return res.status(500).json({
      message: "Failed to fetch exclusive offers",
    });
  }
};
