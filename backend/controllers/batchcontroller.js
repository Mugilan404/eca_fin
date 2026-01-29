const db = require("../config/db");

/* ================= CREATE BATCH ================= */
exports.createBatch = async (req, res) => {
  try {
    const { batch_name, batch_for, batch_price, start_date, end_date } = req.body;

    if (!batch_name || !batch_for || batch_price === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }
console.log(start_date, end_date);
    const [result] = await db.execute(
      `INSERT INTO batch 
       (batch_name, batch_for, batch_price, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [batch_name, batch_for, batch_price, start_date , end_date]
    );

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch_id: result.insertId
    });

  } catch (error) {
    console.error("Create Batch Error:", error);
    res.status(500).json({ success: false });
  }
};

/* ================= ALL BATCHES ================= */
exports.getBatches = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM batch ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
 
/* ================= MATERIAL BATCHES ================= */
exports.getMaterialBatches = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM batch
      WHERE batch_for ='Materials'
      ORDER BY created_at DESC
    `);

    res.json({ success: true, batches: rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ================= TEST BATCHES ================= */
exports.getTestBatches = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM batch
      WHERE batch_for='Tests'
      ORDER BY created_at DESC
    `);

    res.json({ success: true, batches: rows });
  } catch (err) {
    console.error("Test Batches Error:", err);
    res.status(500).json({ success: false });
  }
};

/* ================= MY BATCHES ================= */
exports.getMyBatches = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [rows] = await db.execute(`
      SELECT 
        b.batch_id,
        b.batch_name,
        b.batch_for,
        b.batch_price
      FROM access a
      JOIN batch b ON a.batch_id = b.batch_id
      WHERE a.user_id = ?
        AND a.payment_status = 'SUCCESS'
      ORDER BY a.created_at DESC
    `, [user_id]);

    res.json({ success: true, batches: rows });
  } catch (err) {
    console.log("My Batches Error:", err);
    res.status(500).json({ success: false });
  }
};
exports.getUserAccessibleBatches = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("Fetching batches for email:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    console.log("Email received:", email);
    /* 1️⃣ Resolve user_id */
    const [users] = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    console.log("User query result:", users);
    if (!users.length) {
      return res.json({
        success: true,
        batches: []
      });
    }
    console.log("Found user ID:", users[0].user_id);
    const use_id = users[0].user_id;
    console.log("Fetching batches for user ID:", use_id);
    /* 2️⃣ Fetch accessible batches */
    const [batches] = await db.execute(`
      SELECT DISTINCT
        b.batch_id,
        b.batch_name,
        b.batch_for,
        b.batch_price,
        b.start_date,
        b.end_date
      FROM access a
      JOIN batch b 
        ON b.batch_id = a.batch_id
      WHERE a.user_id = ?
      ORDER BY b.start_date DESC
    `, [users[0].user_id]);
console.log("Batches fetched:", batches);
    res.json({
      success: true,
      batches
    });

  } catch (error) {
    console.error("User batches fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
exports.RevokeAccess = async (req, res) => {
  try {
    const { email, batch_id } = req.body;
    console.log("Revoke access request for email:", email, "batch ID:", batch_id);
    if (!email || !batch_id) {
      return res.status(400).json({
        success: false,
        message: "Email and batch_id are required"
      });
    }
    console.log("Revoking access for email:", email, "and batch ID:", batch_id);
    /* 1️⃣ Get user_id from email */
    const [users] = await db.execute(
      "SELECT user_id, name as user_name FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user_id = users[0].user_id;
    const user_name = users[0].user_name;
    console.log("Resolved user name:", user_name);
    console.log("Resolved user ID:", user_id);
    /* 2️⃣ Delete access */
    const [result] = await db.execute(
      "DELETE FROM access WHERE user_id = ? AND batch_id = ?",
      [user_id , batch_id]
    );
    console.log("Delete result:", result);
    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "No access found for this batch"
      });
    }

    res.json({
      success: true,
      message: "✅ Batch access revoked successfully"
    });
    

  } catch (error) {
    console.error("Revoke access error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
