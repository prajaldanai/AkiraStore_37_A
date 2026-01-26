const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------ SIGNUP -------------------
exports.signupUser = async (req, res) => {
  try {
    const { username, security_question, security_answer, password } = req.body;

    if (!username || !security_question || !security_answer || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      security_question,
      security_answer,
      password_hash: hashedPassword,
    });

    res.json({ success: true, message: "Signup successful!" });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ LOGIN -------------------
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({
      where: { username },
      attributes: ["id", "username", "password_hash", "role", "is_blocked", "block_reason"],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // ========== CHECK IF USER IS BLOCKED ==========
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        statusCode: "BLOCKED",
        message: "Your account has been blocked. Please contact support.",
        reason: user.block_reason || null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    // ========== INCREMENT LOGIN COUNT ==========
    try {
      await User.increment("login_count", { where: { id: user.id } });
    } catch (countError) {
      console.error("Failed to increment login count:", countError);
      // Don't fail login for this
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      username: user.username,
      role: user.role,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// -------- GET SECURITY QUESTION ----------
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({
      where: { username },
      attributes: ["security_question"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, question: user.security_question });

  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------- RESET PASSWORD ----------
exports.resetPassword = async (req, res) => {
  try {
    const { username, security_answer, new_password } = req.body;

    const user = await User.findOne({
      where: { username },
      attributes: ["security_answer"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const correctAnswer = user.security_answer.trim().toLowerCase();

    if (correctAnswer !== security_answer.trim().toLowerCase()) {
      return res.status(400).json({ message: "Incorrect security answer" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await User.update(
      { password_hash: hashedPassword },
      { where: { username } }
    );

    res.json({ success: true, message: "Password reset successful!" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
