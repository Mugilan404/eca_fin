const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  hashPassword,
  comparePassword,
  generateToken
} = require("../helpers/authhelper");

exports.register = async (req, res) => {
  const { name, email, password, contact_no, designation } = req.body;

  const password_hash = await hashPassword(password);

  await db.execute(
    `INSERT INTO users 
     (name,email,contact_no,designation,password_hash)
     VALUES (?,?,?,?,?)`,
    [name, email, contact_no, designation, password_hash]
  );

  res.json({ message: "Registered successfully" });
};

exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // 2️⃣ Fetch student
    const [rows] = await db.execute(
      "SELECT user_id, name, email, password_hash, role FROM users WHERE email = ? AND role = 'student'",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Student account not found"
      });
    }

    const student = rows[0];

    // 3️⃣ Verify password
    const match = await bcrypt.compare(password, student.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      {
        user_id: student.user_id,
        role: student.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Send response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: student.user_id,
        name: student.name,
        email: student.email
      }
    });

  } catch (err) {
    console.error("Student Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found"
      });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        user_id: admin.user_id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};