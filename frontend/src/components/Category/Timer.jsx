const { getProductsByCategoryId } = require("../models/productModel");

exports.getCategoryPage = async (req, res) => {
  try {
    const { slug } = req.params;

    
    let categoryId = null;
    if (slug === "women") categoryId = 2;
    if (slug === "men") categoryId = 1;
    if (slug === "kids") categoryId = 3;

    if (!categoryId) {
      return res.status(400).json({ message: "Invalid category" });
    }


    const products = await getProductsByCategoryId(categoryId);

    console.log("🔥 PRODUCTS FETCHED FOR CATEGORY:", slug, products);

    res.json({
      bestSelling: products.filter((p) => p.tag === "best-selling"),

      newArrivals: products.filter((p) => p.tag === "new-arrival"),

      accessories: products.filter((p) => p.tag === "accessories"),

      exclusiveOffer:
        products.find((p) => p.tag === "exclusive-offer") || null,

      all: products,
    });
  } catch (error) {
    console.error(" CATEGORY PAGE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
