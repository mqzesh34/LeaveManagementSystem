const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, service: "socketService" });
});

app.use("/api/notifications", notificationRoutes);

module.exports = app;
