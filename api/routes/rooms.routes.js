const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/rooms.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, roomsController.getRooms);
router.get('/pending', verifyToken, roomsController.getPendingBookings);
router.post('/book', verifyToken, roomsController.bookRoom);
router.put('/book/:id', verifyToken, roomsController.approveBooking);

module.exports = router;
