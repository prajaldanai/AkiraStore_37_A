require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");

// ✅ Import Sequelize instance (NEW)
const sequelize = require("./database/sequelize");
const runUserStatusMigration = require("./migrations/run-user-status-migration");

// Import routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const productUserRoutes = require("./routes/productUserRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const categoryPageRoutes = require("./routes/categoryPageRoutes");
const commentRoutes = require("./routes/commentRoutes");
const buyNowRoutes = require("./routes/buyNowRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesReportRoutes = require("./routes/salesReportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();

// -------------------------
// STATIC FILES
// -------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// MIDDLEWARE
// -------------------------
// Configure CORS with explicit allowed headers
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
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
app.use("/api/comments", commentRoutes);          // COMMENT ROUTES
app.use("/api/buy-now", buyNowRoutes);            // BUY NOW SESSION ROUTES
app.use("/api/orders", orderRoutes);              // ORDER ROUTES
app.use("/api/admin/orders", adminOrderRoutes);   // ADMIN ORDER ROUTES
app.use("/api/admin/inventory", inventoryRoutes); // ADMIN INVENTORY ROUTES
app.use("/api/admin/sales-report", salesReportRoutes); // ADMIN SALES REPORT ROUTES
app.use("/api/admin/dashboard", dashboardRoutes); // ADMIN DASHBOARD ROUTES
app.use("/api/admin/users", adminUserRoutes);     // ADMIN USER MANAGEMENT ROUTES
app.use("/api/search", searchRoutes);             // PRODUCT SEARCH ROUTES

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
    console.log("✅ Sequelize connected to PostgreSQL");

    try {
      await runUserStatusMigration();
    } catch (migrationError) {
      console.error("Migration failed:", migrationError);
      throw migrationError;
    }

    // Sync models - force:false won't add new columns to existing tables
    // If you need to add columns, run the migration SQL first
    try {
      await sequelize.sync({ force: false });
      console.log("✅ Database models synchronized");
    } catch (syncError) {
      // Check if it's the user_id column missing error
      if (syncError.message && syncError.message.includes('user_id')) {
        console.error("❌ DATABASE MIGRATION REQUIRED:");
        console.error("   The 'user_id' column is missing from 'product_ratings' table.");
        console.error("   Run the migration: backend/migrations/add_user_id_to_product_ratings.sql");
        console.error("   Then restart the server.");
        process.exit(1);
      }
      throw syncError;
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    process.exit(1);
  }
})();
