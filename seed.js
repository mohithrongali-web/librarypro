const { pool, setupDatabase } = require('./server/db/setup'); 
async function run() { 
    await setupDatabase(); 
    const res = await pool.query('SELECT count(*) FROM study_rooms'); 
    if(parseInt(res.rows[0].count) === 0) { 
        await pool.query("INSERT INTO study_rooms (name, capacity, facilities) VALUES ('Seminar Hall A', 20, 'Projector, Whiteboard'), ('Group Study Room B', 6, 'Whiteboard, Power Outlets')"); 
        console.log('Rooms seeded.'); 
    } 
    pool.end(); 
} 
run().catch(console.error);
