const Product = require("./Product");
const Category = require("./Category");          // ✅ NOW EXISTS
const ProductImage = require("./ProductImage");
const ProductFeature = require("./ProductFeature");
const ProductSize = require("./ProductSize");
const ShippingRule = require("./ShippingRule");
const ProductRating = require("./ProductRating");
const ProductComment = require("./ProductComment");
const User = require("./User");

/* =======================
   ASSOCIATIONS
======================= */

// Category → Products
Category.hasMany(Product, { foreignKey: "category_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });

// Product → Images
Product.hasMany(ProductImage, { foreignKey: "product_id" });
ProductImage.belongsTo(Product, { foreignKey: "product_id" });

// Product → Features
Product.hasMany(ProductFeature, { foreignKey: "product_id" });
ProductFeature.belongsTo(Product, { foreignKey: "product_id" });

// Product → Sizes
Product.hasMany(ProductSize, { foreignKey: "product_id" });
ProductSize.belongsTo(Product, { foreignKey: "product_id" });

// Product → Shipping
Product.hasOne(ShippingRule, { foreignKey: "product_id" });
ShippingRule.belongsTo(Product, { foreignKey: "product_id" });

// Product → Ratings
Product.hasMany(ProductRating, { foreignKey: "product_id" });
ProductRating.belongsTo(Product, { foreignKey: "product_id" });

// Product → Comments
Product.hasMany(ProductComment, { foreignKey: "product_id" });
ProductComment.belongsTo(Product, { foreignKey: "product_id" });

// User → Comments
User.hasMany(ProductComment, { foreignKey: "user_id" });
ProductComment.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  Product,
  Category,
  ProductImage,
  ProductFeature,
  ProductSize,
  ShippingRule,
  ProductRating,
  ProductComment,
  User,
};
