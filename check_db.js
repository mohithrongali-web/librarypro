const { pool } = require('./api/db/setup');
(async () => {
    try {
        console.log("Connecting to DB...");
        const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables found:", tablesRes.rows.map(r => r.table_name));
        
        if (tablesRes.rows.some(r => r.table_name === 'users')) {
            const usersRes = await pool.query("SELECT * FROM users LIMIT 5");
            console.log("User count (first 5):", usersRes.rows.length);
            console.log("Users:", usersRes.rows.map(u => ({ id: u.id, email: u.email, role: u.role })));
        } else {
            console.log("USERS table does NOT exist!");
        }
    } catch (e) {
        console.error("CRITICAL DB ERROR:", e);
    } finally {
        await pool.end();
    }
})();
