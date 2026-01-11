const { Product, ProductImage } = require("../models");

exports.getProductsByCategoryId = async (categoryId) => {
  const products = await Product.findAll({
    where: { category_id: categoryId },
    include: [
      {
        model: ProductImage,
        attributes: ["image_url"],
      },
    ],
    order: [["id", "DESC"]],
  });

  return products.map((p) => {
    const images = p.ProductImages
      .map((i) => i.image_url)
      .filter(Boolean)
      .map((i) => i.replace(/\\/g, "/"))
      .map((i) => (i.startsWith("/uploads") ? i : "/uploads/" + i));

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      tag: p.tag,
      images,
    };
  });
};
