const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email, password, isRememberMe } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (user && user.password === password) {
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: isRememberMe ? "30d" : "1d" },
      );

      const cookieMaxAge = isRememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: cookieMaxAge,
      });

      return res.status(200).json({
        success: true,
        message: "Giriş başarılı",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Hatalı e-posta veya şifre",
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server hatası" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, first_name as "firstName", last_name as "lastName", email, role FROM users WHERE id = $1',
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Kullanıcı bulunamadı." });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
  res.json({ success: true, message: "Çıkış yapıldı" });
});

module.exports = router;
