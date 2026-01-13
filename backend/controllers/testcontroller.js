const db = require("../config/db");
const fs = require("fs");
const csv = require("csv-parser");


exports.createTest = async (req, res) => {
  try {
    const {
      batch_id,
      test_name,
      test_category,
      test_time,
      total_questions
    } = req.body;

    const created_by = req.user.user_id;

    const [result] = await db.execute(
      `INSERT INTO tests 
      (batch_id, test_name, test_category, test_time, total_questions, created_by)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        batch_id,
        test_name,
        test_category,
        test_time,
        total_questions,
        created_by
      ]
    );

    res.status(201).json({
      success: true,
      test_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Test creation failed" });
  }
};


exports.getTestsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user.user_id;

    // 🔹 Check access once
    const [accessRows] = await db.execute(
      "SELECT 1 FROM access WHERE user_id = ? AND batch_id = ?",
      [userId, batchId]
    );

    const hasAccess = accessRows.length > 0;

    // 🔹 Fetch tests
    const [tests] = await db.execute(
      `
      SELECT 
        test_id,
        test_name,
        test_category,
        test_time,
        total_questions,
        created_at
      FROM Tests
      WHERE batch_id = ?
      ORDER BY created_at DESC
      `,
      [batchId]
    );

    // 🔹 Attach access flag to each test
    const testsWithAccess = tests.map(test => ({
      ...test,
      has_access: hasAccess
    }));

    res.json({
      success: true,
      tests: testsWithAccess
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tests"
    });
  }
};

