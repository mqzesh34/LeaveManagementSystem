const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/dashboard-stats", authMiddleware, async (req, res) => {
  try {
    const query = `
            SELECT 
                u.id as "userId", 
                u.first_name as "firstName", 
                u.last_name as "lastName", 
                u.role,
                u.total_allowed_leaves as "totalAllowed",
                l.id as "leaveId", 
                l.start_date as "startDate", 
                l.days, 
                l.reason, 
                l.status
            FROM users u
            LEFT JOIN leaves l ON u.id = l.user_id
            ORDER BY l.start_date ASC;
        `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Veriler çekilirken bir hata oluştu." });
  }
});

module.exports = router;
