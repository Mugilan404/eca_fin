const db = require("../config/db");

exports.createClass = async (req, res) => {
  try {
    const { batch_id, topic, class_date, class_time, joinclass } = req.body;

    // Validate required fields
    if (!batch_id || !topic || !class_date || !class_time || !joinclass) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    console.log("Received class data:", req.body);

    // Execute the INSERT query
    const [result] = await db.execute(
      `INSERT INTO classes 
        (batch_id, topic, class_date, class_time, joinclass)
       VALUES (?, ?, ?, ?, ?)`,
      [batch_id, topic.trim(), class_date, class_time.trim(), joinclass.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class_id: result.insertId
    });

  } catch (error) {
    console.error("Create Class Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while creating class" 
    });
  }
};
// Get class by ID
exports.getClassById = async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log("Fetching class with batch ID:", batchId);
    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required"
      });
    }

    // Fetch class from DB
    const [rows] = await db.execute(
      `SELECT class_id, batch_id, topic, class_date, class_time, joinclass 
       FROM classes 
       WHERE batch_id = ?`,
      [batchId]
    );
    console.log("Fetched class data:", rows);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.status(200).json({
      success: true,
      class: rows[0]
    });

  } catch (error) {
    console.error("Get Class by ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching class"
    });
  }
};
exports.deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    console.log("Deleting class with ID:", classId);
    const [result] = await db.execute(
      "DELETE FROM classes WHERE class_id = ?",
      [classId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }
    res.json({
      success: true,
      message: "✅ Class deleted successfully"
    });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};