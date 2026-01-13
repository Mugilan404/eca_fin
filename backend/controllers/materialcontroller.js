const db = require("../config/db");

/* =====================================
   UPLOAD MATERIAL (PROTECTED)
===================================== */
exports.uploadMaterial = async (req, res) => {
  try {
    // Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      });
    }

    const { batch_id, material_name, material_category } = req.body;

    if (!material_name || !material_category) {
      return res.status(400).json({
        success: false,
        message: "Material name and category are required"
      });
    }

    const material_path = `uploads/materials/${req.file.filename}`;
    const uploaded_by = req.user.user_id;

    const sql = `
      INSERT INTO Materials
      (batch_id, material_name, material_category, material_path, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      batch_id || null,
      material_name,
      material_category,
      material_path,
      uploaded_by
    ]);

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      material_id: result.insertId
    });

  } catch (error) {
    console.error("Upload Material Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading material"
    });
  }
};


/* =====================================
   GET MATERIALS BY BATCH (PUBLIC)
===================================== */
exports.getMaterialsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const sql = `
      SELECT
        material_id,
        material_name,
        material_category,
        created_at
      FROM Materials
      WHERE batch_id = ?
      ORDER BY created_at DESC
    `;

    const [materials] = await db.execute(sql, [batchId]);

    res.json({
      success: true,
      materials
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =====================================
   CHECK MATERIAL ACCESS (PUBLIC)
===================================== */
exports.checkMaterialAccess = async (req, res) => {
  try {
    const { materialId } = req.params;

    /* 1️⃣ Fetch material */
    const [materials] = await db.execute(
      `SELECT material_id, material_path, batch_id
       FROM Materials
       WHERE material_id = ?`,
      [materialId]
    );

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    const material = materials[0];

    /* 2️⃣ If user NOT logged in */
    if (!req.user) {
      return res.json({
        success: true,
        isLoggedIn: false,
        hasAccess: false,
        batch_id: material.batch_id,
        pdfPath: material.material_path
      });
    }

    /* 3️⃣ Check ACCESS table */
    const [accessRows] = await db.execute(
      `SELECT access_id
       FROM access
       WHERE user_id = ?
         AND batch_id = ?
         AND payment_status = 'SUCCESS'`,
      [req.user.user_id, material.batch_id]
    );

    const hasAccess = accessRows.length > 0;

    /* 4️⃣ Log material view */
    await db.execute(
      `INSERT INTO material_logs (user_id, material_id)
       VALUES (?, ?)`,
      [req.user.user_id, material.material_id]
    );

    /* 5️⃣ Final response */
    res.json({
      success: true,
      isLoggedIn: true,
      hasAccess,
      batch_id: material.batch_id,
      pdfPath: material.material_path
    });

  } catch (error) {
    console.error("Material Access Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking material access"
    });
  }
};
