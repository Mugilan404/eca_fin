const db = require("../config/db");
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const [rows] = await db.execute(
      "SELECT user_id, name, email FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
