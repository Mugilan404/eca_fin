const fs = require("fs");
const csv = require("csv-parser");
const db = require("../config/db");
const path = require("path");

/* =====================================================
   UPLOAD QUESTIONS CSV + MOVE IMAGES
===================================================== */
exports.uploadQuestionsCSV = async (req, res) => {
  try {
    const { test_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required"
      });
    }

    /* 1️⃣ Fetch batch_name & test_name */
    const [[test]] = await db.query(
      `SELECT t.test_name, b.batch_name
       FROM tests t
       JOIN batch b ON t.batch_id = b.batch_id
       WHERE t.test_id = ?`,
      [test_id]
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }

    const { batch_name, test_name } = test;

    /* ================= PATH SETUP ================= */
    const CSV_IMAGE_DIR = path.join(__dirname, "../uploads/csv_images");

    const QUESTION_IMAGE_DIR = path.join(
      __dirname,
      `../uploads/batches/${batch_name}/${test_name}/images`
    );

    // Create folder if not exists
    fs.mkdirSync(QUESTION_IMAGE_DIR, { recursive: true });

    console.log("CSV IMAGE DIR:", CSV_IMAGE_DIR);
    console.log("DEST IMAGE DIR:", QUESTION_IMAGE_DIR);

    const questions = [];

    /* ================= IMAGE HANDLER ================= */
    const moveImage = (filename) => {
      if (!filename) return null;

      filename = filename.toString().trim();
      if (!filename) return null;

      const srcPath = path.join(CSV_IMAGE_DIR, filename);
      const destPath = path.join(QUESTION_IMAGE_DIR, filename);

      if (!fs.existsSync(srcPath)) {
        console.warn("❌ Image not found:", filename);
        return null;
      }

      fs.copyFileSync(srcPath, destPath);

      console.log("✅ Image moved:", filename);

      // Save relative path in DB
      return `uploads/batches/${batch_name}/${test_name}/images/${filename}`;
    };

    /* ================= READ CSV ================= */
    fs.createReadStream(req.file.path)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.replace(/^\uFEFF/, "").trim()
        })
      )
      .on("data", (row) => {
        questions.push([
          test_id,
          row.question_type?.toLowerCase() || "mcq",
          row.question_text || null,
          row.question_image || null,

          row.option_a_type?.toLowerCase() || "text",
          row.option_a_text || null,
          row.option_a_image || null,

          row.option_b_type?.toLowerCase() || "text",
          row.option_b_text || null,
          row.option_b_image || null,

          row.option_c_type?.toLowerCase() || "text",
          row.option_c_text || null,
          row.option_c_image || null,

          row.option_d_type?.toLowerCase() || "text",
          row.option_d_text || null,
          row.option_d_image || null,

          row.correct_answer,
          row.reference_text || null,
          row.reference_video_url || null
        ]);
      })
      .on("end", async () => {
        try {
          if (!questions.length) {
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
            message: "Questions & images uploaded successfully"
          });

        } catch (err) {
          console.error("DB INSERT ERROR:", err);
          res.status(500).json({
            success: false,
            message: "Failed to insert questions"
          });
        }
      })
      .on("error", (err) => {
        console.error("CSV ERROR:", err);
        res.status(400).json({
          success: false,
          message: err.message
        });
      });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =====================================================
   FETCH QUESTIONS FOR TEST UI
===================================================== */
exports.getQuestionsByTest = async (req, res) => {
  try {
    const { testId } = req.params;

    /* 1️⃣ Fetch test, batch & time */
    const [[test]] = await db.query(
      `SELECT 
         t.test_time,
         t.test_name,
         b.batch_name
       FROM tests t
       JOIN batch b ON t.batch_id = b.batch_id
       WHERE t.test_id = ?`,
      [testId]
    );

    if (!test) {
      return res.json({
        success: false,
        message: "Test not found"
      });
    }

    /* 2️⃣ Fetch questions */
    const [questions] = await db.query(
      `SELECT
        question_id,
        question_text,
        question_image,
        option_a_text, option_a_image,
        option_b_text, option_b_image,
        option_c_text, option_c_image,
        option_d_text, option_d_image
       FROM questions
       WHERE test_id = ?
       ORDER BY question_id`,
      [testId]
    );

    /* 3️⃣ Respond */
    res.json({
      success: true,
      test_time: test.test_time,
      test_name: test.test_name,
      batch_name: test.batch_name,
      total_questions: questions.length,
      questions
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Upload question images to:
 * uploads/questions/{batch_name}/{test_name}/
 */
exports.uploadQuestionImages = async (req, res) => {
  try {
    const { batch_id, test_id } = req.body;

    if (!batch_id || !test_id) {
      return res.status(400).json({
        success: false,
        message: "batch_id and test_id are required"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded"
      });
    }

    /* 1️⃣ Fetch batch_name & test_name */
    const [[test]] = await db.query(
      `SELECT t.test_name, b.batch_name
       FROM tests t
       JOIN batch b ON t.batch_id = b.batch_id
       WHERE t.test_id = ? AND b.batch_id = ?`,
      [test_id, batch_id]
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Batch/Test not found"
      });
    }

    const safeBatch = test.batch_name.replace(/\s+/g, "_");
    const safeTest = test.test_name.replace(/\s+/g, "_");

    /* 2️⃣ Destination folder */
    const DEST_DIR = path.join(
      __dirname,
      `../uploads/questions/${safeBatch}/${safeTest}`
    );

    if (!fs.existsSync(DEST_DIR)) {
      fs.mkdirSync(DEST_DIR, { recursive: true });
    }

    /* 3️⃣ Save images */
    const savedImages = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const filename = `${base}${ext}`;

      const fullPath = path.join(DEST_DIR, filename);

      fs.writeFileSync(fullPath, file.buffer);

      savedImages.push({
        original: file.originalname,
        stored_path: `uploads/questions/${safeBatch}/${safeTest}/${filename}`
      });
    }

    res.json({
      success: true,
      message: "Images uploaded successfully",
      batch: safeBatch,
      test: safeTest,
      images: savedImages
    });

  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error while uploading images"
    });
  }
};
