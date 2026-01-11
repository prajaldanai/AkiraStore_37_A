require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");

// ✅ Import Sequelize instance (NEW)
const sequelize = require("./database/sequelize");

// Import routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const productUserRoutes = require("./routes/productUserRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const categoryPageRoutes = require("./routes/categoryPageRoutes");

const app = express();

// -------------------------
// STATIC FILES
// -------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// MIDDLEWARE
// -------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// ROUTES
// -------------------------
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", productRoutes);                    // ADMIN PRODUCT ROUTES
app.use("/api/user/products", productUserRoutes); // USER PRODUCT ROUTES
app.use("/api/rating", ratingRoutes);
app.use("/api/category-page", categoryPageRoutes);

console.log("🔥 Routes mounted");

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working...");
});

// -------------------------
// START SERVER WITH SEQUELIZE
// -------------------------
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // ✅ Test Sequelize connection
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    
    console.log("✅ Sequelize connected to PostgreSQL");

    // ⚠️ OPTIONAL (keep false if DB already exists)
    // await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    process.exit(1);
  }
})();
