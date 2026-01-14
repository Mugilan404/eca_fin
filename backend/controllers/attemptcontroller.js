const db = require("../config/db");

exports.startAttempt = async (req, res) => {
  const { test_id } = req.body;

  const [result] = await db.execute(
    "INSERT INTO test_attempts (user_id,test_id,started_at) VALUES (?,?,NOW())",
    [req.user.user_id, test_id]
  );

  res.json({ attempt_id: result.insertId });
};

/* ===== GET LOGGED-IN USER ATTEMPTS ===== */
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.user_id;
console.log("Fetching attempts for user ID:", userId);
    const sql = `
      SELECT
        ta.attempt_id,
        ta.test_id,
        t.test_name,
        t.test_category,
        t.total_questions,
        ta.correct_answers,
        ta.score,
        ta.submitted_at as completed_at
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.test_id
      WHERE ta.user_id = ?
      ORDER BY ta.submitted_at DESC
    `;
console.log("Returning attempts for user:", userId);
    const [attempts] = await db.execute(sql, [userId]);

    res.json({
      success: true,
      attempts
    });

  } catch (error) {
    console.error("Get My Attempts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch test attempts"
    });
  }
};
