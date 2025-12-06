const express = require("express");
const router = express.Router();

// TEMPORARY EMPTY ROUTES
router.get("/", (req, res) => {
  res.json({ message: "Category routes placeholder" });
});

module.exports = router;
