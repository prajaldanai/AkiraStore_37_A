const { getProductsByCategoryId } = require("../services/productService");

exports.getCategoryPage = async (req, res) => {
  try {
    const { slug } = req.params;

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

    const products = await getProductsByCategoryId(categoryId);

    const response = {
      bestSelling: products.filter((p) => p.tag === "best-selling"),
      newArrivals: products.filter((p) => p.tag === "new-arrival"),
      accessories: products.filter((p) => p.tag === "accessories"),
      exclusiveOffer:
        products.find((p) => p.tag === "exclusive-offer") || null,
      all: products,
    };

    res.json(response);

  } catch (error) {
    console.error("❌ CATEGORY PAGE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
