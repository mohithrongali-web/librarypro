const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { verifyToken, isLibrarian } = require('../middleware/auth.middleware');

router.get('/', verifyToken, facultyController.getFacultyRequests);
router.post('/', verifyToken, facultyController.createFacultyRequest);

// To simplify, we keep the approval logic minimal, or implement it if you'd like an 'approve/reject' endpoint structure in the future for faculty requests
// Actually: Since Librarian dashboard only views them in our updated plan:
module.exports = router;
