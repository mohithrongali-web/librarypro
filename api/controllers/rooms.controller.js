const { pool } = require('../db/setup');

const getRooms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM study_rooms ORDER BY name');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const bookRoom = async (req, res) => {
    try {
        const { room_id } = req.body;
        const user_id = req.userId; // from auth middleware

        // Check availability
        const roomCheck = await pool.query('SELECT * FROM study_rooms WHERE id = $1', [room_id]);
        if (roomCheck.rows.length === 0) return res.status(404).json({ message: "Room not found" });
        if (!roomCheck.rows[0].available || roomCheck.rows[0].capacity <= 0) {
            return res.status(400).json({ message: "Room is fully booked" });
        }

        // Create booking
        await pool.query(
            'INSERT INTO room_bookings (room_id, user_id, status) VALUES ($1, $2, $3)',
            [room_id, user_id, 'pending']
        );

        res.status(201).json({ success: true, message: "Room booking requested. Waiting for librarian approval." });
    } catch (error) {
        console.error("Error booking room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const approveBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        
        const booking = await pool.query('SELECT * FROM room_bookings WHERE id = $1', [id]);
        if (booking.rows.length === 0) return res.status(404).json({ message: "Booking not found" });

        const status = action === 'approve' ? 'approved' : 'rejected';
        await pool.query('UPDATE room_bookings SET status = $1 WHERE id = $2', [status, id]);

        if (status === 'approved') {
            const roomCheck = await pool.query('SELECT * FROM study_rooms WHERE id = $1', [booking.rows[0].room_id]);
            const newCapacity = roomCheck.rows[0].capacity - 1;
            await pool.query('UPDATE study_rooms SET capacity = $1, available = $2 WHERE id = $3', [newCapacity, newCapacity > 0, booking.rows[0].room_id]);
            await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [booking.rows[0].user_id, `Your room booking for ${roomCheck.rows[0].name} is approved.`]);
        } else {
            await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [booking.rows[0].user_id, `Your room booking was rejected.`]);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getPendingBookings = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.id, b.booking_date, u.name as student_name, u.roll_no as student_roll_number, r.name as room_name 
            FROM room_bookings b
            JOIN users u ON b.user_id = u.id
            JOIN study_rooms r ON b.room_id = r.id
            WHERE b.status = 'pending'
            ORDER BY b.booking_date ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getRooms, bookRoom, approveBooking, getPendingBookings };
