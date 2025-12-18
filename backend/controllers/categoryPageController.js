const { getProductsByCategoryId } = require("../models/productModel");

exports.getCategoryPage = async (req, res) => {
  try {
    const { slug } = req.params;

    // Map slug → category ID safely
    const CATEGORY_MAP = {
      men: 1,
      women: 2,
      kids: 3,
    };

    const categoryId = CATEGORY_MAP[slug];

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid category slug",
      });
    }

    // Fetch products from DB
    const products = await getProductsByCategoryId(categoryId);

    console.log(`🔥 CATEGORY PAGE → ${slug} (${products.length} items)`);

    // Build the response that frontend expects
    const response = {
      bestSelling: products.filter((p) => p.tag === "best-selling"),
      newArrivals: products.filter((p) => p.tag === "new-arrival"),
      accessories: products.filter((p) => p.tag === "accessories"),
      exclusiveOffer:
        products.find((p) => p.tag === "exclusive-offer") || null,
      all: products,
    };

    return res.json(response);

  } catch (error) {
    console.error("❌ CATEGORY PAGE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
