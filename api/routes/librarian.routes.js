const express = require('express');
const router = express.Router();
const libController = require('../controllers/librarian.controller');
const { verifyToken, isLibrarian } = require('../middleware/auth.middleware');

router.get('/stats', verifyToken, isLibrarian, libController.getStats);
router.get('/students/all', verifyToken, isLibrarian, libController.getAllStudents);
router.get('/librarians/all', verifyToken, isLibrarian, libController.getAllLibrarians);
router.get('/transactions/all', verifyToken, isLibrarian, libController.getAllTransactions);
router.get('/transactions/pending', verifyToken, isLibrarian, libController.getPendingTransactions);
router.get('/transactions/overdue', verifyToken, isLibrarian, libController.getOverdueTransactions);
router.post('/transactions/:id/action', verifyToken, isLibrarian, libController.transactionAction);

module.exports = router;
