const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/LibraryProject/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await pool.query(`
            ALTER TABLE books 
            ADD COLUMN IF NOT EXISTS rack_location VARCHAR(50),
            ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT 'https://picsum.photos/id/1/100/140',
            ADD COLUMN IF NOT EXISTS available_copies INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS total_copies INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS isbn VARCHAR(50),
            ADD COLUMN IF NOT EXISTS publication_year VARCHAR(10),
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS publisher VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pages INT;
        `);

        // Migrate 'rack' data to 'rack_location' if it exists and rack_location is null
        await pool.query(`
            UPDATE books SET rack_location = rack WHERE rack_location IS NULL;
        `);

        // Check if there are any books in the DB
        const res = await pool.query('SELECT COUNT(*) FROM books');
        if (parseInt(res.rows[0].count) === 0) {
            console.log("No books found, seeding dummy books...");
            await pool.query(`
                INSERT INTO books (title, author, category, rack_location, cover_url, available_copies, total_copies, isbn, publication_year, description, publisher, pages, available)
                VALUES 
                ('The Pragmatic Programmer', 'David Thomas', 'Computer Science', 'Rack A-2', 'https://picsum.photos/id/20/100/140', 2, 3, '978-0201616224', '1999', 'A classic guide.', 'Addison-Wesley', 352, true),
                ('Clean Code', 'Robert Martin', 'Programming', 'Rack B-1', 'https://picsum.photos/id/26/100/140', 1, 2, '978-0132350884', '2008', 'Writing clean code.', 'Prentice Hall', 464, true)
            `);
        }

        console.log("Database altered successfully.");
    } catch(e) {
        console.error("Migration error:", e);
    } finally {
        await pool.end();
    }
})();
