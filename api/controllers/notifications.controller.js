const { pool } = require('../db/setup');

const getNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', 
            [req.userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [id, req.userId]);
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
