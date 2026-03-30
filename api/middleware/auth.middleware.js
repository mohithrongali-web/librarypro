const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    // Bearer token syntax handling
    const tokenPart = token.split(' ')[1] || token;

    jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isLibrarian = (req, res, next) => {
    if (req.userRole === 'librarian') {
        next();
    } else {
        res.status(403).json({ message: 'Require Librarian Role' });
    }
};

const isStudent = (req, res, next) => {
    if (req.userRole === 'student') {
        next();
    } else {
        res.status(403).json({ message: 'Require Student Role' });
    }
};

module.exports = {
    verifyToken,
    isLibrarian,
    isStudent
};
