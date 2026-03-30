const { pool } = require('../db/setup');

const createRequest = async (req, res) => {
    try {
        const { book_id } = req.body;
        const user_id = req.userId; // from auth middleware

        // Check if book exists and is available
        const bookCheck = await pool.query('SELECT available FROM books WHERE id = $1', [book_id]);
        if (bookCheck.rows.length === 0) return res.status(404).json({ message: "Book not found" });
        if (!bookCheck.rows[0].available) return res.status(400).json({ message: "Book is not available currently" });

        // Create request
        const result = await pool.query(
            'INSERT INTO requests (user_id, book_id, status) VALUES ($1, $2, $3) RETURNING *',
            [user_id, book_id, 'pending']
        );

        // Optional: Update book to unavailable temporarily, or wait till approved. Let's wait till approved.
        res.status(201).json({ message: "Book requested successfully", request: result.rows[0] });
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getRequests = async (req, res) => {
    try {
        let result;
        if (req.userRole === 'librarian') {
            // Librarian sees all requests with user & book details
            result = await pool.query(`
                SELECT r.*, u.name as student_name, u.roll_no, b.title as book_title 
                FROM requests r
                JOIN users u ON r.user_id = u.id
                JOIN books b ON r.book_id = b.id
                ORDER BY r.request_date DESC
            `);
        } else {
            // Student sees only their requests
            result = await pool.query(`
                SELECT r.*, b.title as book_title, b.author 
                FROM requests r
                JOIN books b ON r.book_id = b.id
                WHERE r.user_id = $1 
                ORDER BY r.request_date DESC
            `, [req.userId]);
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected' or 'returned'

        if (!['approved', 'rejected', 'returned'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const reqCheck = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
        if (reqCheck.rows.length === 0) return res.status(404).json({ message: "Request not found" });
        
        const requestRow = reqCheck.rows[0];

        // Update Request
        const result = await pool.query(
            'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        // Create Notification
        let notificationMsg = `Your book request has been ${status}.`;
        if (status === 'approved') {
            const tenDaysFromNow = new Date();
            tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
            await pool.query('UPDATE requests SET return_date = $1 WHERE id = $2', [tenDaysFromNow, id]);
            
            // Decrement available copies
            await pool.query('UPDATE books SET available_copies = GREATEST(0, available_copies - 1) WHERE id = $1', [requestRow.book_id]);
            // Only set available = false if no copies left
            await pool.query('UPDATE books SET available = (SELECT available_copies > 0 FROM books WHERE id = $1) WHERE id = $1', [requestRow.book_id]);
            
            notificationMsg = `Your request for book has been approved. Please collect it.`;
        } else if (status === 'rejected') {
            notificationMsg = `Your request for book has been rejected.`;
        } else if (status === 'returned') {
            // Increment available copies
            await pool.query('UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = $1', [requestRow.book_id]);
            await pool.query('UPDATE books SET available = true WHERE id = $1', [requestRow.book_id]);
            
            notificationMsg = `Your book return has been acknowledged.`;
        }

        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [requestRow.user_id, notificationMsg]
        );

        res.status(200).json({ message: `Request ${status} successfully`, request: result.rows[0] });

    } catch (error) {
        console.error("Error updating request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createRequest,
    getRequests,
    updateRequestStatus
};
