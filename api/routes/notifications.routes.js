const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, notificationsController.getNotifications);
router.put('/:id/read', verifyToken, notificationsController.markAsRead);

module.exports = router;
