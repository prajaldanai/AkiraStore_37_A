require("dotenv").config();
const path = require("path");


const express = require("express");
const cors = require("cors");


// Import DB connection
const { connectDB } = require("./database/db");

// Import routes
const authRoutes = require("./routes/authRoutes");

const categoryRoutes = require("./routes/categoryRoutes");  // ⭐ ADD THIS

const productRoutes = require("./routes/productRoutes"); 

const app = express();


// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// MIDDLEWARE (MUST BE FIRST)
// -------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// ROUTES (AFTER MIDDLEWARE)
// -------------------------
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/categories", categoryRoutes);  // ⭐ ADD THIS

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
