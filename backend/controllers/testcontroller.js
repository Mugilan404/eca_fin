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


exports.submitTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { test_id, answers } = req.body;

    if (!test_id || !answers) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // 1️⃣ Fetch correct answers
    const [questions] = await db.query(
      "SELECT question_id, correct_answer FROM questions WHERE test_id = ?",
      [test_id]
    );

    let score = 0;
    const total = questions.length;
console.log(answers);
    // 2️⃣ Create attempt
    const [attemptResult] = await db.query(
      `INSERT INTO test_attempts 
       (user_id, test_id, score, total_questions, started_at, submitted_at)
       VALUES (?, ?, 0, ?, NOW(), NOW())`,
      [userId, test_id, total]
    );
console.log(attemptResult);
    const attemptId = attemptResult.insertId;

    // 3️⃣ Evaluate & store answers
    for (const q of questions) {
      const selected = answers[q.question_id];
      const isCorrect = selected === q.correct_answer;

      if (isCorrect) score++;

      await db.query(
        `INSERT INTO student_answers 
         (attempt_id, question_id, selected_option, is_correct)
         VALUES (?, ?, ?, ?)`,
        [attemptId, q.question_id, selected || null, isCorrect]
      );
    }
console.log("Score calculated:", score);
    // 4️⃣ Update score
    await db.query(
      "UPDATE test_attempts SET score = ? WHERE attempt_id = ?",
      [score, attemptId]
    );

    res.json({
      success: true,
      attempt_id: attemptId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.user_id;
console.log("Fetching result for attempt ID:", attemptId, "User ID:", userId);
    /* ================= FETCH ATTEMPT + TEST + BATCH ================= */
    const [attemptRows] = await db.execute(
      `
      SELECT 
        ta.attempt_id,
        ta.test_id,
        ta.score,
        ta.started_at,
        ta.submitted_at AS completed_at,
        t.test_name,
        t.total_questions,
        b.batch_name
      FROM test_attempts ta
      JOIN tests t  ON ta.test_id = t.test_id
      JOIN batch b  ON t.batch_id = b.batch_id
      WHERE ta.attempt_id = ? AND ta.user_id = ?
      `,
      [attemptId, userId]
    );
console.log("Attempt Rows:", attemptRows);
    if (attemptRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or attempt not found"
      });
    }

    const attempt = attemptRows[0];

    /* ================= FETCH QUESTIONS + USER ANSWERS ================= */
    const [questions] = await db.execute(
      `
      SELECT
        q.question_id,
        q.question_text,
        q.question_image,
        q.option_a_text,
        q.option_a_image,
        q.option_b_text,
        q.option_b_image,
        q.option_c_text,
        q.option_c_image,
        q.option_d_text,
        q.option_d_image,
        q.correct_answer,
        ua.selected_option,
        q.reference_text,
        q.reference_video_url
      FROM questions q
      LEFT JOIN student_answers ua
        ON q.question_id = ua.question_id
       AND ua.attempt_id = ?
      WHERE q.test_id = ?
      ORDER BY q.question_id
      `,
      [attemptId, attempt.test_id]
    );

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      result: {
        attempt_id: attempt.attempt_id,
        test_id: attempt.test_id,
        test_name: attempt.test_name,
        batch_name: attempt.batch_name,   // 🔥 REQUIRED
        total_questions: attempt.total_questions,
        correct_answers: attempt.score,
        score: attempt.score,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        questions
      }
    });

  } catch (error) {
    console.error("GET RESULT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch test result"
    });
  }
};
