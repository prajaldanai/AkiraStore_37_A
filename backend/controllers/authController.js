const { pool } = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ------------------ SIGNUP FUNCTION -------------------
exports.signupUser = async (req, res) => {
  try {
    const { username, security_question, security_answer, password } = req.body;

    if (!username || !security_question || !security_answer || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (username, security_question, security_answer, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [username, security_question, security_answer, hashedPassword]
    );

    res.json({ success: true, message: "Signup successful!" });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================== FINAL LOGIN USER ==================
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};


// GET SECURITY QUESTION
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { username } = req.body;

    const result = await pool.query(
      "SELECT security_question FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, question: result.rows[0].security_question });

  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { username, security_answer, new_password } = req.body;

    const result = await pool.query(
      "SELECT security_answer FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const correctAnswer = result.rows[0].security_answer.trim().toLowerCase();

    if (correctAnswer !== security_answer.trim().toLowerCase()) {
      return res.status(400).json({ message: "Incorrect security answer" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = $2",
      [hashedPassword, username]
    );

    res.json({ success: true, message: "Password reset successful!" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
