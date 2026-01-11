const {
  Product,
  Category,
  ProductImage,
  ProductRating,
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

    const product = await Product.findByPk(id, {
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
      subQuery: false,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
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
    console.error("getProductDetails ERROR:", err);
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


