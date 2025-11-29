require("dotenv").config();            // Load environment variables
require("./database/db");              // Connect to PostgreSQL

const express = require("express");
const app = express();

// Middleware
app.use(express.json());               // Allow JSON body parsing

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working...");
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
