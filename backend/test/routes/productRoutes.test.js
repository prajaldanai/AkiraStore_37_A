const request = require("supertest");
const express = require("express");

jest.mock("../../controllers/productController", () => ({
  addProduct: jest.fn((req, res) => res.status(201).json({ id: 101 })),
  getProductsByCategory: jest.fn((req, res) =>
    res.json({ categoryId: Number(req.params.categoryId) })
  ),
  getCategoryBySlug: jest.fn((req, res) => res.json({ slug: req.params.slug })),
  getProductById: jest.fn((req, res) => res.json({ id: Number(req.params.id) })),
  updateProduct: jest.fn((req, res) => res.json({ updated: true })),
  deleteProduct: jest.fn((req, res) => res.json({ deleted: true })),
  subscribeProductUpdates: jest.fn((req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.status(200).end();
  }),
}));

jest.mock("../../controllers/userProductController", () => ({
  getProductDetails: jest.fn((req, res) => res.json({ public: true, id: Number(req.params.id) })),
}));

jest.mock("../../middlewares/uploadMiddleware", () => ({
  array: () => (req, res, next) => next(),
}));

const productRoutes = require("../../routes/productRoutes");
const {
  addProduct,
  getProductsByCategory,
  getCategoryBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
  subscribeProductUpdates,
} = require("../../controllers/productController");

const { getProductDetails } = require("../../controllers/userProductController");

const app = express();
app.use(express.json());
app.use("/api", productRoutes);

describe("Product routes wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/products/subscribe triggers SSE helper", async () => {
    const res = await request(app).get("/api/products/subscribe");

    expect(res.status).toBe(200);
    expect(subscribeProductUpdates).toHaveBeenCalled();
  });

  test("GET /api/categories/:slug proxies to controller", async () => {
    const res = await request(app).get("/api/categories/shoes");

    expect(res.body).toEqual({ slug: "shoes" });
    expect(getCategoryBySlug).toHaveBeenCalled();
  });

  test("GET /api/admin/products/category/:categoryId returns formatted category", async () => {
    const res = await request(app).get("/api/admin/products/category/5");

    expect(res.body).toEqual({ categoryId: 5 });
    expect(getProductsByCategory).toHaveBeenCalled();
  });

  test("GET /api/products/:id uses public controller", async () => {
    const res = await request(app).get("/api/products/15");

    expect(res.body).toEqual({ public: true, id: 15 });
    expect(getProductDetails).toHaveBeenCalled();
  });

  test("GET /api/admin/products/:id uses admin controller", async () => {
    const res = await request(app).get("/api/admin/products/22");

    expect(res.body).toEqual({ id: 22 });
    expect(getProductById).toHaveBeenCalled();
  });

  test("POST /api/admin/products creates a product", async () => {
    const res = await request(app).post("/api/admin/products").send({ name: "Test" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 101 });
    expect(addProduct).toHaveBeenCalled();
  });

  test("PUT /api/admin/products/:id updates a product", async () => {
    const res = await request(app).put("/api/admin/products/12").send({ price: 99 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: true });
    expect(updateProduct).toHaveBeenCalled();
  });

  test("DELETE /api/admin/products/:id deletes a product", async () => {
    const res = await request(app).delete("/api/admin/products/12");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(deleteProduct).toHaveBeenCalled();
  });
});
