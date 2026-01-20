const jwt = require("jsonwebtoken");

// Middleware to verify token (required)
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
    // ⭐ NORMALIZE: Add 'id' alias so controllers can use req.user.id OR req.user.userId
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id, // Ensure 'id' is always available
    };

    // Continue to next function
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Middleware for optional authentication (guest checkout support)
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // ⭐ NORMALIZE: Add 'id' alias so controllers can use req.user.id OR req.user.userId
      req.user = {
        ...decoded,
        id: decoded.userId || decoded.id, // Ensure 'id' is always available
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Invalid token, but allow as guest
    req.user = null;
    next();
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  // Check if user has admin role (adjust field name based on your User model)
  if (req.user.role !== "admin" && req.user.isAdmin !== true) {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
};
