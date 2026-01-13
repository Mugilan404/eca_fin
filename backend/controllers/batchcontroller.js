const db = require("../config/db");

/* ================= CREATE BATCH ================= */
exports.createBatch = async (req, res) => {
  try {
    const { batch_name, batch_for, batch_price, batch_type } = req.body;

    if (!batch_name || !batch_for || batch_price === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await db.execute(
      `INSERT INTO batch 
       (batch_name, batch_for, batch_price, batch_type)
       VALUES (?, ?, ?, ?)`,
      [batch_name, batch_for, batch_price, batch_type || "BOTH"]
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
