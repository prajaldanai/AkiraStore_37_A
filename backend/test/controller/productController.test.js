jest.mock("../../models", () => {
  const ProductImage = { bulkCreate: jest.fn(), destroy: jest.fn() };
  const ProductFeature = { bulkCreate: jest.fn(), destroy: jest.fn() };
  const ProductSize = { bulkCreate: jest.fn(), destroy: jest.fn() };
  const ShippingRule = { destroy: jest.fn(), create: jest.fn() };

  return {
    Product: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
    Category: {
      findOne: jest.fn(),
    },
    ProductRating: {
      destroy: jest.fn(),
    },
    ProductImage,
    ProductFeature,
    ProductSize,
    ShippingRule,
  };
});

const {
  addProduct,
  getProductsByCategory,
  getCategoryBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../../controllers/productController");
const {
  Product,
  Category,
  ProductImage,
  ProductFeature,
  ProductSize,
  ShippingRule,
  ProductRating,
} = require("../../models");

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.write = jest.fn();
  return res;
}

describe("productController helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getCategoryBySlug returns 404 when slug missing", async () => {
    Category.findOne.mockResolvedValue(null);
    const req = { params: { slug: "missing" } };
    const res = buildRes();

    await getCategoryBySlug(req, res);

    expect(Category.findOne).toHaveBeenCalledWith({
      where: { slug: "missing" },
      attributes: ["id", "name", "slug"],
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
  });

  test("getCategoryBySlug returns the category data", async () => {
    const category = { id: 2, name: "Shoes", slug: "shoes" };
    Category.findOne.mockResolvedValue(category);
    const req = { params: { slug: "shoes" } };
    const res = buildRes();

    await getCategoryBySlug(req, res);

    expect(res.json).toHaveBeenCalledWith(category);
  });

  test("getProductsByCategory fails for invalid id", async () => {
    const req = { params: { categoryId: "0" } };
    const res = buildRes();

    await getProductsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid category ID" });
    expect(Product.findAll).not.toHaveBeenCalled();
  });

  test("getProductsByCategory formats products when found", async () => {
    const rawProduct = {
      id: 1,
      name: "Sneaker",
      price: 90,
      old_price: 110,
      tag: "best-selling",
      exclusive_offer_end: null,
      stock: null,
      ProductImages: [{ image_url: "uploads/shoe.jpg" }],
    };
    Product.findAll.mockResolvedValue([rawProduct]);

    const req = { params: { categoryId: "5" } };
    const res = buildRes();

    await getProductsByCategory(req, res);

    expect(Product.findAll).toHaveBeenCalledWith({
      where: { category_id: 5 },
      include: [{ model: ProductImage, attributes: ["image_url"] }],
      order: [["id", "DESC"]],
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "Sneaker",
            price: 90,
            images: expect.arrayContaining([expect.any(String)]),
          }),
        ]),
      })
    );
  });

  test("getProductById rejects invalid id", async () => {
    const req = { params: { id: "abc" } };
    const res = buildRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid product ID",
    });
  });

  test("getProductById returns 404 when product missing", async () => {
    Product.findByPk.mockResolvedValue(null);
    const req = { params: { id: "3" } };
    const res = buildRes();

    await getProductById(req, res);

    expect(Product.findByPk).toHaveBeenCalledWith(3, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("addProduct rejects when required fields are missing", async () => {
    const req = { body: { price: "50" }, files: [] };
    const res = buildRes();

    await addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product name and price are required",
    });
  });

  test("addProduct rejects invalid category slug", async () => {
    Category.findOne.mockResolvedValue(null);
    const req = {
      body: {
        name: "Sneaker",
        price: "100",
        categorySlug: "invalid",
      },
      files: [],
    };
    const res = buildRes();

    await addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid category slug",
    });
  });

  test("addProduct creates product when payload is valid", async () => {
    const createdProduct = {
      id: 111,
      name: "Classic Sneaker",
      price: 120,
      tag: null,
      old_price: null,
      exclusive_offer_end: null,
    };
    Product.create.mockResolvedValue(createdProduct);
    const req = {
      body: {
        name: "Classic Sneaker",
        price: "120",
        category_id: "2",
      },
      files: [],
    };
    const res = buildRes();

    await addProduct(req, res);

    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Classic Sneaker",
        price: 120,
        category_id: 2,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      productId: 111,
      product: {
        id: 111,
        name: "Classic Sneaker",
        price: 120,
        old_price: null,
        tag: null,
        exclusive_offer_end: null,
      },
    });
  });

  test("updateProduct returns 404 when product is missing", async () => {
    Product.findByPk.mockResolvedValue(null);
    const req = { params: { id: "12" }, body: {} };
    const res = buildRes();

    await updateProduct(req, res);

    expect(Product.findByPk).toHaveBeenCalledWith(12, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("updateProduct rejects empty name", async () => {
    const product = {
      id: 7,
      tag: null,
      price: 120,
      old_price: null,
      exclusive_offer_end: null,
      ProductImages: [],
      ProductFeatures: [],
      ProductSizes: [],
      ShippingRule: null,
      update: jest.fn().mockResolvedValue(),
    };
    Product.findByPk.mockResolvedValue(product);
    const req = { params: { id: "7" }, body: { name: "   " } };
    const res = buildRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product name cannot be empty",
    });
    expect(product.update).not.toHaveBeenCalled();
  });

  test("updateProduct applies payload and related resources", async () => {
    const product = {
      id: 7,
      tag: null,
      price: 100,
      old_price: null,
      exclusive_offer_end: null,
      ProductImages: [],
      ProductFeatures: [],
      ProductSizes: [],
      ShippingRule: null,
      update: jest.fn().mockResolvedValue(),
    };
    Product.findByPk.mockResolvedValue(product);
    const req = {
      params: { id: "7" },
      body: {
        name: "Exclusive Sneaker",
        tag: "exclusive-offer",
        price: "50",
        old_price: "90",
        exclusive_offer_end: "2099-01-01",
        existingImages: ["existing.png"],
        features: '["Feature One"]',
        sizes: '["M"]',
        shipping: JSON.stringify({ home_delivery_charge: 12 }),
      },
      files: [{ filename: "new.png" }],
    };
    const res = buildRes();

    await updateProduct(req, res);

    expect(product.update).toHaveBeenCalled();
    expect(ProductImage.destroy).toHaveBeenCalledWith({ where: { product_id: 7 } });
    expect(ProductImage.bulkCreate).toHaveBeenCalledWith([
      { product_id: 7, image_url: "existing.png" },
      { product_id: 7, image_url: "/uploads/new.png" },
    ]);
    expect(ProductFeature.destroy).toHaveBeenCalledWith({ where: { product_id: 7 } });
    expect(ProductFeature.bulkCreate).toHaveBeenCalledWith([
      { product_id: 7, feature_text: "Feature One" },
    ]);
    expect(ProductSize.destroy).toHaveBeenCalledWith({ where: { product_id: 7 } });
    expect(ProductSize.bulkCreate).toHaveBeenCalledWith([
      { product_id: 7, size_text: "M" },
    ]);
    expect(ShippingRule.destroy).toHaveBeenCalledWith({ where: { product_id: 7 } });
    expect(ShippingRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 7,
        home_delivery_charge: 12,
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product updated successfully",
      })
    );
  });

  test("deleteProduct cleans up related data and deletes the product", async () => {
    const product = { id: 9 };
    Product.findByPk.mockResolvedValue(product);
    const req = { params: { id: "9" } };
    const res = buildRes();

    await deleteProduct(req, res);

    expect(ProductImage.destroy).toHaveBeenCalledWith({ where: { product_id: 9 } });
    expect(ProductFeature.destroy).toHaveBeenCalledWith({ where: { product_id: 9 } });
    expect(ProductSize.destroy).toHaveBeenCalledWith({ where: { product_id: 9 } });
    expect(ShippingRule.destroy).toHaveBeenCalledWith({ where: { product_id: 9 } });
    expect(ProductRating.destroy).toHaveBeenCalledWith({ where: { product_id: 9 } });
    expect(Product.destroy).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Product deleted successfully",
    });
  });
});
