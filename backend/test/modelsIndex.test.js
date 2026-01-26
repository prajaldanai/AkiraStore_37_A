const models = require("../models");

describe("models index exports", () => {
  test("exposes every model entry", () => {
    const expectedModels = [
      "Product",
      "Category",
      "ProductImage",
      "ProductFeature",
      "ProductSize",
      "ShippingRule",
      "ProductRating",
      "ProductComment",
      "User",
      "BuyNowSession",
      "Order",
      "OrderItem",
    ];

    expect(Object.keys(models)).toEqual(expectedModels);
    expectedModels.forEach((modelName) => {
      expect(models[modelName]).toBeTruthy();
      expect(models[modelName].name).toBe(modelName);
    });
  });
});

describe("associations wired in index.js", () => {
  test("product/category relationship is present", () => {
    expect(models.Product.associations.Category).toBeDefined();
    expect(models.Category.associations.Products).toBeDefined();
  });

  test("user connects to comments, BuyNowSessions, orders", () => {
    expect(models.User.associations.ProductComments).toBeDefined();
    expect(models.User.associations.BuyNowSessions).toBeDefined();
    expect(models.User.associations.Orders).toBeDefined();
  });

  test("buy now session and order associations", () => {
    expect(models.BuyNowSession.associations.User).toBeDefined();
    expect(models.BuyNowSession.associations.Product).toBeDefined();
    expect(models.BuyNowSession.associations.Order).toBeDefined();
    expect(models.Order.associations.User).toBeDefined();
    expect(models.Order.associations.BuyNowSession).toBeDefined();
    expect(models.Order.associations.items).toBeDefined();
    expect(models.OrderItem.associations.Order).toBeDefined();
  });
});
