const db = require("../config/db");

/**
 * Grant access & update enrollment status
 */
exports.grantAccess = async (req, res) => {
  try {
    const { enroll_id, payment_status, paid_through } = req.body;

    if (!enroll_id) {
      return res.status(400).json({ success: false, message: "Enroll ID required" });
    }

    // Fetch enrollment
    const [enrollRows] = await db.execute(
      "SELECT user_id, batch_id FROM enroll WHERE enroll_id = ?",
      [enroll_id]
    );
console.log("Enroll rows:", enrollRows);
    if (!enrollRows.length) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    const { user_id, batch_id } = enrollRows[0];

    // Insert or update access
    await db.execute(
      `INSERT INTO access (user_id, batch_id, payment_status, paid_through)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payment_status = VALUES(payment_status),
         paid_through = VALUES(paid_through)`,
      [user_id, batch_id, payment_status, paid_through]
    );

    // Update enroll status
    await db.execute(
      "UPDATE enroll SET enroll_status = 'granted access' WHERE enroll_id = ?",
      [enroll_id]
    );

    res.json({ success: true, message: "Access granted successfully" });

  } catch (err) {
    console.error("Grant access error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * Fetch enrollment details
 */
exports.getEnrollDetails = async (req, res) => {
  try {
    const { enrollId } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        e.enroll_id,
        e.email,
        e.batch_id,
        e.payment_image,
        e.enroll_status,
        u.name AS username,
        b.batch_name,
        b.batch_price
      FROM enroll e
      JOIN users u ON u.email = e.email
      JOIN batch b ON b.batch_id = e.batch_id
      WHERE e.enroll_id = ?
    `, [enrollId]);

    if (!rows.length) {
      return res.json({ success: false, message: "Enrollment not found" });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
