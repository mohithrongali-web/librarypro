const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books.controller');
const { verifyToken, isLibrarian } = require('../middleware/auth.middleware');

router.get('/', booksController.getAllBooks);
router.get('/:id', booksController.getBookById);
router.post('/', verifyToken, isLibrarian, booksController.addBook);

module.exports = router;
