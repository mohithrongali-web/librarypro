const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/setup');

const register = async (req, res) => {
    try {
        const { name, email, password, role, roll_no } = req.body;

        const finalName = name || (role === 'student' ? `Student ${roll_no}` : 'Library Staff');

        if (!email || !password || !role) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, roll_no) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, roll_no',
            [finalName, email, hashedPassword, role, role === 'student' ? roll_no : null]
        );

        res.status(201).json({ message: "User registered successfully", user: result.rows[0] });

    } catch (error) {
        console.error("Register Error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found or role mismatch." });
        }

        const user = userResult.rows[0];
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key_dont_use_in_prod',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            roll_no: user.roll_no,
            accessToken: token
        });

    } catch (error) {
        console.error("Login Error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    register,
    login
};
