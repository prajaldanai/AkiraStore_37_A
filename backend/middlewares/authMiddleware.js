const jwt = require("jsonwebtoken");

// Middleware to verify token
exports.verifyToken = (req, res, next) => {
  try {
    // Expect token in headers: Authorization: Bearer <token>
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add decoded data (userId, username) to req object
    req.user = decoded;

    // Continue to next function
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
