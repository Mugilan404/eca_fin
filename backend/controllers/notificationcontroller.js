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
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log("Deleting notification with ID:", notificationId);
    const [result] = await db.execute(
      "DELETE FROM notifications WHERE notification_id = ?",
      [notificationId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    res.json({
      success: true,
      message: "✅ Notification deleted successfully"
    });
  } catch (error) {
    console.error("Delete notification error:", error);
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
exports.getAllNotifications = async (req, res) => {
  try {
    const [notifications] = await db.execute(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    console.log("Fetched all notifications for admin:", notifications);
    //console.log("Fetched all notifications for admin:", notifications);
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Fetch all notifications error:", error);
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
exports.createPopup = async (req, res) => {
  try {
    const { redirect_url } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Popup image is required"
      });
    }

    const imgPath = `/uploads/popups/${req.file.filename}`;
    console.log("Popup image path:", imgPath);

    // Ensure the popup table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS popup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        img_path VARCHAR(255) NOT NULL,
        redirect_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [result] = await db.execute(
      "INSERT INTO popup (img_path, redirect_url) VALUES (?, ?)",
      [imgPath, redirect_url || null]
    );

    if (result.affectedRows === 0) {
      throw new Error("Insertion failed: no rows affected");
    }

    console.log("Popup created with image path:", imgPath);
    res.json({
      success: true,
      message: "✅ Popup created successfully"
    });

  } catch (error) {
    console.error("Create popup error:", error);
    let message = "Server error";
    if (error.code === 'ER_DUP_ENTRY') {
      message = "Duplicate entry: Popup with this image path already exists";
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      message = "Database table missing: Please initialize the database";
    } else if (error.message) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
};
exports.getPopup = async (req, res) => {
  try {
    console.log("Fetching active popup");

    // Ensure the popup table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS popup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        img_path VARCHAR(255) NOT NULL,
        redirect_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fetch the latest popup
    const [rows] = await db.execute(
      "SELECT img_path, redirect_url FROM popup ORDER BY popup_id DESC LIMIT 1"
    );
    console.log("Fetched popup data:", rows);
    if (rows.length === 0) {
      return res.json({
        success: true,
        popup: null
      });
    }

    res.json({
      success: true,
      popup: {
        img_path: rows[0].img_path,
        redirect_url: rows[0].redirect_url
      }
    });

  } catch (error) {
    console.error("Get popup error:", error);
    let message = "Server error";
    if (error.code === 'ER_NO_SUCH_TABLE') {
      message = "Database table missing: Please initialize the database";
    } else if (error.message) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
};
