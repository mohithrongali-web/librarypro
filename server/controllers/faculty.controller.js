const { pool } = require('../db/setup');

const getFacultyRequests = async (req, res) => {
    try {
        let result;
        if (req.userRole === 'librarian') {
            result = await pool.query('SELECT * FROM faculty_requests ORDER BY request_date DESC');
        } else {
            result = await pool.query('SELECT * FROM faculty_requests WHERE user_id = $1 ORDER BY request_date DESC', [req.userId]);
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching faculty requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const createFacultyRequest = async (req, res) => {
    try {
        const { faculty_name, department, book_title, reason } = req.body;
        const user_id = req.userId;

        const result = await pool.query(
            'INSERT INTO faculty_requests (user_id, faculty_name, department, book_title, reason) VALUES ($1, $2, $3, $4, $5)',
            [user_id, faculty_name, department, book_title, reason]
        );

        res.status(201).json({ success: true, message: "Request captured successfully" });
    } catch (error) {
        console.error("Error capturing faculty request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getFacultyRequests, createFacultyRequest };
