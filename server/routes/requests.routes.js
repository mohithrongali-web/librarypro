const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requests.controller');
const { verifyToken, isLibrarian, isStudent } = require('../middleware/auth.middleware');

router.post('/', verifyToken, isStudent, requestsController.createRequest);
router.get('/', verifyToken, requestsController.getRequests);
router.put('/:id', verifyToken, requestsController.updateRequestStatus);

module.exports = router;
