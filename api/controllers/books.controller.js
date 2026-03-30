const { pool } = require('../db/setup');

const getAllBooks = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Book not found" });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const addBook = async (req, res) => {
    try {
        const { title, author, category, rack_location, cover_url, available_copies, total_copies, isbn, publication_year, description, publisher, pages, available } = req.body;
        if (!title || !author) return res.status(400).json({ message: "Title and author required" });
        
        const result = await pool.query(
            `INSERT INTO books 
            (title, author, category, rack_location, cover_url, available_copies, total_copies, isbn, publication_year, description, publisher, pages, available) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [title, author, category, rack_location, cover_url, available_copies || 1, total_copies || 1, isbn, publication_year, description, publisher, pages, available !== false]
        );
        res.status(201).json({ message: "Book added successfully", book: result.rows[0] });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getAllBooks,
    getBookById,
    addBook
};
