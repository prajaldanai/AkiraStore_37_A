const Product = require("../models/Product");

describe("Product model definition", () => {
  test("maps to products table without timestamps", () => {
    expect(Product.getTableName()).toBe("products");
    expect(Product.options.timestamps).toBe(false);
  });

  test("allows building a product snapshot with basic pricing data", async () => {
    const product = Product.build({
      name: "Minimal Sneaker",
      category_id: 2,
      price: 120.5,
      stock: 10,
    });

    await expect(product.validate()).resolves.toBeDefined();
  });
});
