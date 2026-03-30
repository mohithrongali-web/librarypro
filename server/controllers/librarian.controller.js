const { pool } = require('../db/setup');

const getStats = async (req, res) => {
    try {
        const totalBooksResult = await pool.query('SELECT SUM(total_copies) as count FROM books');
        const currentlyBorrowedResult = await pool.query("SELECT COUNT(*) as count FROM requests WHERE status = 'approved' AND return_date IS NULL");
        const overdueResult = await pool.query("SELECT COUNT(*) as count FROM requests WHERE status = 'approved' AND return_date < NOW()");
        const pendingRequestsResult = await pool.query("SELECT COUNT(*) as count FROM requests WHERE status = 'pending'");
        const totalStudentsResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const availableBooksResult = await pool.query('SELECT COUNT(*) as count FROM books WHERE available = true');
        const totalFacultyRequestsResult = await pool.query("SELECT COUNT(*) as count FROM faculty_requests");

        res.status(200).json({
            total_books: parseInt(totalBooksResult.rows[0].count) || 0,
            currently_borrowed: parseInt(currentlyBorrowedResult.rows[0].count) || 0,
            overdue: parseInt(overdueResult.rows[0].count) || 0,
            pending_requests: parseInt(pendingRequestsResult.rows[0].count) || 0,
            total_students: parseInt(totalStudentsResult.rows[0].count) || 0,
            available_books: parseInt(availableBooksResult.rows[0].count) || 0,
            total_faculty_requests: parseInt(totalFacultyRequestsResult.rows[0].count) || 0
        });
    } catch (error) {
        console.error("Error fetching library stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, roll_no as \"rollNumber\", email, 'Computer Science' as department, to_char(created_at, 'YYYY-MM-DD') as joined_date, '+91 0000 0000' as phone FROM users WHERE role = 'student' ORDER BY name"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllLibrarians = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email FROM users WHERE role = 'librarian'"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching librarians:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        // App.js usually expects all requests via `/api/transactions/all`
        const result = await pool.query(`
            SELECT r.id, r.status, to_char(r.request_date, 'YYYY-MM-DD') as request_date, 
                   to_char(r.return_date, 'YYYY-MM-DD') as due_date, 
                   to_char(r.return_date, 'YYYY-MM-DD') as return_date, 
                   u.name as student_name, u.roll_no as student_roll_number, b.title as book_title
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN books b ON r.book_id = b.id
            ORDER BY r.request_date DESC
        `);
        // We ensure data is wrapped because app.js expects Axios response `res.data` -> direct array if standard, but our override unwraps some. Wait, no. Standard express endpoint returns ARRAY, Axios wraps in `res.data`.
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Also Pending and Overdue endpoints mapped for Librarian
const getPendingTransactions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.status, to_char(r.request_date, 'YYYY-MM-DD') as request_date, 
                   u.name as student_name, u.roll_no as student_roll_number, b.title as book_title
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN books b ON r.book_id = b.id
            WHERE r.status = 'pending'
            ORDER BY r.request_date DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching pending:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getOverdueTransactions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.status, to_char(r.return_date, 'YYYY-MM-DD') as due_date, 
                   u.name as student_name, u.roll_no as student_roll_number, b.title as book_title
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN books b ON r.book_id = b.id
            WHERE r.status = 'approved' AND r.return_date < NOW()
            ORDER BY r.return_date ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching overdue:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Handle Librarian approve/reject via the identical URL
const transactionAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        const reqCheck = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
        if (reqCheck.rows.length === 0) return res.status(404).json({ message: "Not found" });
        const requestRow = reqCheck.rows[0];

        await pool.query('UPDATE requests SET status = $1 WHERE id = $2', [status, id]);
        
        let notificationMsg = `Your book request has been ${status}.`;
        if (status === 'approved') {
            const date = new Date(); date.setDate(date.getDate() + 10);
            await pool.query('UPDATE requests SET return_date = $1 WHERE id = $2', [date, id]);
            
            // Decrement available copies
            await pool.query('UPDATE books SET available_copies = GREATEST(0, available_copies - 1) WHERE id = $1', [requestRow.book_id]);
            // Only set available = false if no copies left
            await pool.query('UPDATE books SET available = (SELECT available_copies > 0 FROM books WHERE id = $1) WHERE id = $1', [requestRow.book_id]);
        } else if (status === 'returned') {
            // Increment available copies
            await pool.query('UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = $1', [requestRow.book_id]);
            await pool.query('UPDATE books SET available = true WHERE id = $1', [requestRow.book_id]);
        }

        await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [requestRow.user_id, notificationMsg]);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error handling action:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getStats, getAllStudents, getAllLibrarians, getAllTransactions, getPendingTransactions, getOverdueTransactions, transactionAction
};
