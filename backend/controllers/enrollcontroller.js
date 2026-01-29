const db = require("../config/db");

/* 🔹 Fetch batch name */
exports.getBatchById = async (req, res) => {
  const { batchId } = req.params;

  const [[batch]] = await db.query(
    "SELECT batch_name FROM batch WHERE batch_id = ?",
    [batchId]
  );
console.log("Fetched batch:", batch);
  if (!batch) {
    return res.json({ success: false, message: "Batch not found" });
  }

  res.json({ success: true, batch });
};

/* 🔹 Enroll + payment upload */
exports.submitEnrollment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, email, mobile, batch_id } = req.body;
    const paymentImage = req.file?.filename;

    if (!name || !email || !mobile || !batch_id || !paymentImage) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    /* 🔒 Prevent duplicate enrollment */
    const [existing] = await db.execute(
      "SELECT enroll_id FROM enroll WHERE user_id = ? AND batch_id = ?",
      [userId, batch_id]
    );

    if (existing.length) {
      return res.json({
        success: false,
        message: "You already enrolled for this batch"
      });
    }

    /* 📝 Insert enrollment */
    await db.execute(
      `
      INSERT INTO enroll
        (user_id, batch_id, email, mobile, payment_image, enroll_status)
      VALUES (?, ?, ?, ?, ?, 'enrolled')
      `,
      [userId, batch_id, email, mobile, paymentImage]
    );

    res.json({
      success: true,
      message: "Enrollment submitted successfully"
    });

  } catch (err) {
    console.error("ENROLL SUBMIT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getEnrollDetails = async (req, res) => {
  try {
    const { enrollId } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        e.enroll_id,
        e.email,
        e.batch_id,
        e.payment_image,
        e.created_at,

        u.user_id,
        u.name AS username,

        b.batch_name,
        b.batch_price,

        a.payment_status,
        a.paid_through

      FROM enroll e
      JOIN users u ON u.user_id = e.user_id
      JOIN batch b ON b.batch_id = e.batch_id
      LEFT JOIN access a 
        ON a.user_id = e.user_id 
        AND a.batch_id = e.batch_id

      WHERE e.enroll_id = ?
    `, [enrollId]);

    if (!rows.length) {
      return res.json({
        success: false,
        message: "Enrollment not found"
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("Get Enroll Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
/* ================= UPDATE ENROLL STATUS ================= */
exports.updateEnrollStatus = async (req, res) => {
  try {
    const { enroll_id, enroll_status } = req.body;

    if (!enroll_id || !enroll_status) {
      return res.json({
        success: false,
        message: "Missing data"
      });
    }
    console.log("Updating enroll ID:", enroll_id, "to status:", enroll_status);
    const allowed = ["enrolled", "granted access", "sent material"];
    if (!allowed.includes(enroll_status)) {
      return res.json({
        success: false,
        message: "Invalid status"
      });
    }
    console.log("Executing update query");
    const [result] = await db.query(
      "UPDATE enroll SET enroll_status = ? WHERE enroll_id = ?",
      [enroll_status, enroll_id]
    );
    console.log("Update result:", result);
    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Enrollment not found"
      });
    }
    console.log("Enrollment status updated successfully");
    res.json({
      success: true,
      message: "Enrollment status updated"
    });

  } catch (err) {
    console.error("UPDATE ENROLL ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
exports.getEnrollDetails = async (req, res) => {
  try {
    const { enrollId } = req.params;
    console.log("Fetching details for enroll ID:", enrollId);
    const [rows] = await db.execute(`
      SELECT 
        e.enroll_id,
        e.email,
        e.batch_id,
        e.payment_image,
        u.name AS username,
        b.batch_name,
        b.batch_price
      FROM enroll e
      JOIN users u ON u.email = e.email
      JOIN batch b ON b.batch_id = e.batch_id
      WHERE e.enroll_id = ?
    `, [enrollId]);
    console.log("Enroll details fetched:", rows);
    if (!rows.length) {
      return res.json({ success: false, message: "Enrollment not found" });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEnroll = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        e.enroll_id,
        e.user_id,
        u.name,
        u.email AS user_email,
        e.mobile,
        b.batch_id,
        b.batch_name,
        e.payment_image,
        e.enroll_status,
        e.created_at
      FROM enroll e
      JOIN users u ON e.user_id = u.user_id
      JOIN batch b ON e.batch_id = b.batch_id
      ORDER BY e.created_at DESC
    `);

    res.json({
      success: true,
      enrollments: rows
    });

  } catch (err) {
    console.error("FETCH ENROLL REQUESTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment requests"
    });
  }
};
exports.getEnrollRequests = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        e.enroll_id,
        e.email,
        e.batch_id,
        e.payment_image,
        u.name AS username,
        b.batch_name,
        b.batch_price,
        COALESCE(a.payment_status, 'PENDING') AS payment_status
      FROM enroll e
      JOIN users u 
        ON u.email = e.email
      JOIN batch b 
        ON b.batch_id = e.batch_id
      LEFT JOIN access a 
        ON a.user_id = u.user_id 
       AND a.batch_id = e.batch_id
      WHERE e.enroll_status='Enrolled'
      ORDER BY e.enroll_id DESC
    `);

    console.log("Pending enroll requests fetched:", rows);

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: []   // important for frontend safety
      });
    }

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error("Error fetching enroll requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
