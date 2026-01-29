/**
 * ==========================================
 *  Elumalai's Chemistry Academy - Server
 * ==========================================
 */

const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* =====================================================
   GLOBAL MIDDLEWARES
===================================================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   STATIC FILE SERVING
===================================================== */

/* ---- Uploaded Files (PDFs, Images, etc.) ---- */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "backend/uploads"))
);

/* ---- Frontend (HTML, CSS, JS) ---- */
const FRONTEND_PATH = path.join(__dirname, "front");
app.use(express.static(FRONTEND_PATH));

/* =====================================================
   ROOT ROUTE
=node==================================================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "home.html"));
});

/* =====================================================
   API ROUTES
===================================================== */
app.use("/api/auth", require("./backend/routes/authroutes"));
app.use("/api/users", require("./backend/routes/userroutes"));
app.use("/api/batch", require("./backend/routes/batchroutes"));
app.use("/api/access", require("./backend/routes/accessroutes"));
console.log("✅ batch routes loaded");
app.use("/api/materials", require("./backend/routes/materialroutes"));
app.use("/api/tests", require("./backend/routes/testroutes"));
app.use("/api/questions", require("./backend/routes/questionroutes"));
app.use("/api/attempts", require("./backend/routes/attemptroutes"));
app.use("/api/enroll", require("./backend/routes/enrollroutes"));
console.log("✅ enroll routes loaded");
const notificationRoutes = require("./backend/routes/notificationroutes");
app.use("/api/notifications", notificationRoutes);
console.log("✅ notification routes loaded");
/* =====================================================
   SPA / 404 FALLBACK
===================================================== */
app.use((req, res) => {
  res.status(404).sendFile(path.join(FRONTEND_PATH, "home.html"));
});

/* =====================================================
   SERVER START
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
