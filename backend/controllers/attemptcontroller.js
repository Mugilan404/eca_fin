const db = require("../config/db");

exports.startAttempt = async (req, res) => {
  const { test_id } = req.body;

  const [result] = await db.execute(
    "INSERT INTO test_attempts (user_id,test_id,started_at) VALUES (?,?,NOW())",
    [req.user.user_id, test_id]
  );

  res.json({ attempt_id: result.insertId });
};
