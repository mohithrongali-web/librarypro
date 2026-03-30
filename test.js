async function test() {
    try {
        let token;
        // Register or login
        const loginPayload = { email: 'studentX@studypal.local', password: 'password123', role: 'student' };
        let res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginPayload)
        });
        
        if (!res.ok) {
            await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...loginPayload, name: 'Test Student', roll_no: 'studentX' })
            });
            res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginPayload)
            });
        }
        
        const data = await res.json();
        token = data.accessToken;
        
        const booksRes = await fetch('http://localhost:3000/api/books', { headers: { Authorization: `Bearer ${token}` } });
        const books = await booksRes.json();
        
        const harryPotter = books.find(b => b.title.includes('Harry'));
        if (!harryPotter) {
            console.log("Harry Potter book not found. Looking at Pragmatic Programmer...");
            const altBook = books[0];
            const borrowRes = await fetch('http://localhost:3000/api/requests', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ book_id: altBook.id })
            });
            console.log("Borrow Alt Book Response:", await borrowRes.json());
            return;
        }

        console.log('Found Book UUID:', harryPotter.id);
        
        const borrowRes = await fetch('http://localhost:3000/api/requests', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ book_id: harryPotter.id })
        });
        console.log('Borrow Success Status:', borrowRes.status);
        console.log('Borrow Data:', await borrowRes.json());
        
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
