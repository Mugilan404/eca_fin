const db = require("../config/db");

exports.grantAccess = async (req, res) => {
  try {
    const { email, batch_id, payment_status, paid_through } = req.body;

    if (!email || !batch_id || !payment_status || !paid_through) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    /* 1️⃣ Get user_id using email */
    const [users] = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    const user_id = users[0].user_id;

    /* 2️⃣ Insert or Update access */
    await db.execute(
      `
      INSERT INTO access (user_id, batch_id, payment_status, paid_through)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        payment_status = VALUES(payment_status),
        paid_through = VALUES(paid_through)
      `,
      [user_id, batch_id, payment_status, paid_through]
    );

    res.json({
      success: true,
      message: "Batch access granted successfully"
    });

  } catch (error) {
    console.error("Grant Access Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
