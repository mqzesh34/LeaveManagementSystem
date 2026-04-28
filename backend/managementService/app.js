const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/leaves", leaveRoutes);

module.exports = app;
