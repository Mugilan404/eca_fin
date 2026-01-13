const fs = require("fs");
const csv = require("csv-parser");
const db = require("../config/db");

exports.uploadQuestionsCSV = async (req, res) => {
  const { test_id } = req.params;

  console.log("TEST ID:", test_id);
  console.log("FILE:", req.file);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required"
    });
  }

  const questions = [];

  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) =>
        header.replace(/^\uFEFF/, "").trim()
    }))
    .on("data", (row) => {
      console.log("ROW:", row);

      if (!row.question_type || !row.correct_answer) {
        throw new Error("Invalid CSV format: missing question_type");
      }

      questions.push([
        test_id,
        row.question_type.toLowerCase(),
        row.question_text || null,
        null,
        row.option_a_type.toLowerCase(),
        row.option_a_text || null,
        null,
        row.option_b_type.toLowerCase(),
        row.option_b_text || null,
        null,
        row.option_c_type.toLowerCase(),
        row.option_c_text || null,
        null,
        row.option_d_type.toLowerCase(),
        row.option_d_text || null,
        null,
        row.correct_answer,
        row.reference_text || null,
        row.reference_video_url || null
      ]);
    })
    .on("end", async () => {
      try {
        if (questions.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid questions found in CSV"
          });
        }

        await db.query(
          `INSERT INTO questions (
            test_id, question_type, question_text, question_image,
            option_a_type, option_a_text, option_a_image,
            option_b_type, option_b_text, option_b_image,
            option_c_type, option_c_text, option_c_image,
            option_d_type, option_d_text, option_d_image,
            correct_answer, reference_text, reference_video_url
          ) VALUES ?`,
          [questions]
        );

        res.json({
          success: true,
          message: "Questions uploaded successfully"
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({
          success: false,
          message: "Failed to insert questions"
        });
      }
    })
    .on("error", err => {
      console.error("CSV ERROR:", err);
      res.status(400).json({
        success: false,
        message: err.message
      });
    });
};

exports.getQuestionsByTest = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.json({
        success: false,
        message: "Test ID is required"
      });
    }

    // 1️⃣ Fetch test info
    const [testRows] = await db.query(
      "SELECT test_time FROM tests WHERE test_id = ?",
      [testId]
    );

    if (testRows.length === 0) {
      return res.json({
        success: false,
        message: "Test not found"
      });
    }

    const testTime = testRows[0].test_time;

    // 2️⃣ Fetch questions
    const [questions] = await db.query(
      `SELECT 
        question_id,
        question_text,
        option_a_text,
        option_b_text,
        option_c_text,
        option_d_text
       FROM questions
       WHERE test_id = ?
       ORDER BY question_id ASC`,
      [testId]
    );
    console.log("QUESTIONS:", questions);
    if (questions.length === 0) {
      return res.json({
        success: false,
        message: "No questions found for this test"
      });
    }

    // 3️⃣ Send response
    res.json({
      success: true,
      test_time: testTime,
      questions
    });

  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
