const Category = require("../models/Category");

describe("Category model definition", () => {
  test("maps to the categories table and disables timestamps", () => {
    expect(Category.getTableName()).toBe("categories");
    expect(Category.options.timestamps).toBe(false);
  });

  test("validates when both name and slug are provided", async () => {
    const validCategory = Category.build({
      name: "Electronics",
      slug: "electronics",
    });

    await expect(validCategory.validate()).resolves.toBeDefined();
  });

  test("rejects missing name", async () => {
    const categoryWithoutName = Category.build({ slug: "missing-name" });

    await expect(categoryWithoutName.validate()).rejects.toThrow(/name/i);
  });

  test("rejects missing slug", async () => {
    const categoryWithoutSlug = Category.build({ name: "Missing Slug" });

    await expect(categoryWithoutSlug.validate()).rejects.toThrow(/slug/i);
  });
});
