const express = require("express");
const router = express.Router();

// Import controllers
const { signupUser, loginUser ,getSecurityQuestion, 
  resetPassword } = require("../controllers/authController");

// Import middleware

const { verifyToken } = require("../middlewares/authMiddleware")

// PUBLIC ROUTES
router.post("/signup", signupUser);
router.post("/login", loginUser);

// FORGET PASSWORD ROUTES
router.post("/get-question", getSecurityQuestion);
router.post("/reset-password", resetPassword)


// 🔒 PROTECTED ROUTE (requires token)
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "This is your protected profile route",
    user: req.user
  });
});

module.exports = router;
