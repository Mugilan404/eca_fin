const db = require("../config/db"); // adjust path if needed

exports.createNotification = async (req, res) => {
  try {
    const { description, url } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Description is required"
      });
    }

    await db.execute(
      "INSERT INTO notifications (description, url) VALUES (?, ?)",
      [description, url || null]
    );

    res.json({
      success: true,
      message: "✅ Notification posted successfully"
    });

  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    console.log("Fetched notifications:", notifications);
    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
// Get top 3 (latest)
exports.getTop3Notifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 3"
    );

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error("Fetch top 3 notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get top 10 (latest)
exports.getTop10Notifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10"
    );
    console.log("Fetched top 10 notifications:", notifications);
    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error("Fetch top 10 notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
