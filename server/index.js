require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { setupDatabase } = require('./db/setup');

const authRoutes = require('./routes/auth.routes');
const booksRoutes = require('./routes/books.routes');
const requestsRoutes = require('./routes/requests.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const librarianRoutes = require('./routes/librarian.routes');
const studyRoomsRoutes = require('./routes/rooms.routes');
const facultyRequestsRoutes = require('./routes/faculty.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/librarian', librarianRoutes);
app.use('/api/study-rooms', studyRoomsRoutes);
app.use('/api/faculty-requests', facultyRequestsRoutes);
// Route aliases for backward compatibility with app.js frontend
app.use('/api/students/all', (req, res) => res.redirect('/api/librarian/students/all'));
app.use('/api/librarians/all', (req, res) => res.redirect('/api/librarian/librarians/all'));
app.use('/api/transactions', librarianRoutes);

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../client')));

// Setup database and start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.DATABASE_URL) {
        await setupDatabase();
    } else {
        console.log('No DATABASE_URL provided. Skipping auto table setup.');
    }
});
