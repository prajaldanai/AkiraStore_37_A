require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");

// Import DB connection
const { connectDB } = require("./database/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");    
const productUserRoutes = require("./routes/productUserRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const categoryPageRoutes = require("./routes/categoryPageRoutes");


const app = express();

// Serve uploaded images as static files
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
app.use("/api", productRoutes);                     // ⭐ ADMIN PRODUCT ROUTES
app.use("/api/user/products", productUserRoutes);  // ⭐ USER PRODUCT ROUTES
app.use("/api/rating", ratingRoutes);
app.use("/api/category-page", categoryPageRoutes);




console.log("🔥 productRoutes MOUNTED");

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working...");
});

// -------------------------
// START SERVER
// -------------------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
