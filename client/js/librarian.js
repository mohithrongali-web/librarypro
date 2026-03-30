document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'librarian') {
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    document.getElementById('welcome-msg').textContent = `Welcome, ${user.name}`;

    // Add Book Form
    document.getElementById('add-book-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const msg = document.getElementById('add-msg');
        
        const payload = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            rack: document.getElementById('rack').value,
        };

        try {
            btn.disabled = true;
            await apiFetch('/books', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            msg.textContent = 'Book added successfully!';
            msg.style.color = 'var(--secondary)';
            e.target.reset();
        } catch (error) {
            msg.textContent = error.message;
            msg.style.color = 'var(--danger)';
        } finally {
            btn.disabled = false;
        }
    });

    const loadRequests = async () => {
        try {
            const requests = await apiFetch('/requests');
            const pendingTbody = document.getElementById('pending-tbody');
            const issuedTbody = document.getElementById('issued-tbody');
            
            pendingTbody.innerHTML = '';
            issuedTbody.innerHTML = '';

            const now = new Date();

            requests.forEach(req => {
                if (req.status === 'pending') {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${req.student_name} (${req.roll_no})</td>
                        <td>${req.book_title}</td>
                        <td>${new Date(req.request_date).toLocaleDateString()}</td>
                        <td style="display: flex; gap: 0.5rem;">
                            <button class="secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="updateReq('${req.id}', 'approved')">Approve</button>
                            <button class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="updateReq('${req.id}', 'rejected')">Reject</button>
                        </td>
                    `;
                    pendingTbody.appendChild(tr);
                } else if (req.status === 'approved') {
                    const returnDate = new Date(req.return_date);
                    const isDelayed = returnDate < now;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${req.student_name}</td>
                        <td>${req.book_title}</td>
                        <td><span style="color: ${isDelayed ? 'var(--danger)' : 'inherit'}">${returnDate.toLocaleDateString()}</span></td>
                        <td>
                            <button style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="updateReq('${req.id}', 'returned')">Mark Returned</button>
                        </td>
                    `;
                    issuedTbody.appendChild(tr);
                }
            });

        } catch (error) {
            console.error("Failed to load requests", error);
        }
    };

    window.updateReq = async (id, status) => {
        try {
            await apiFetch(`/requests/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            loadRequests();
        } catch (error) {
            alert(error.message);
        }
    };

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    // Initial Load
    loadRequests();
});
