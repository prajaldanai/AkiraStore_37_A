const express = require("express");
const router = express.Router();
const pool = require("../database/db");

router.post("/register", async (req, res) => {
  try {
    const { fullName, securityQuestion, securityAnswer, password } = req.body;

    const newUser = await pool.query(
      "INSERT INTO users (full_name, security_question, security_answer, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [fullName, securityQuestion, securityAnswer, password]
    );

    res.json({ message: "User registered successfully", user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
