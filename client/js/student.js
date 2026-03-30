document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'student') {
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    document.getElementById('welcome-msg').textContent = `Welcome, ${user.name}`;

    const loadBooks = async () => {
        try {
            const books = await apiFetch('/books');
            const grid = document.getElementById('books-grid');
            grid.innerHTML = '';
            
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${book.title}</h3>
                    <p>Author: ${book.author}</p>
                    <p style="font-size: 0.85rem;">Rack: ${book.rack || 'N/A'}</p>
                    <p style="margin-top: 1rem;">
                        <span class="status ${book.available ? 'approved' : 'rejected'}">
                            ${book.available ? 'Available' : 'Unavailable'}
                        </span>
                    </p>
                    <button class="${book.available ? '' : 'hidden'}" style="margin-top: 1rem;" onclick="requestBook('${book.id}')">Request Book</button>
                `;
                grid.appendChild(card);
            });
        } catch (error) {
            console.error("Failed to load books", error);
        }
    };

    const loadRequests = async () => {
        try {
            const requests = await apiFetch('/requests');
            const tbody = document.getElementById('requests-tbody');
            tbody.innerHTML = '';

            requests.forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${req.book_title}</td>
                    <td>${req.author}</td>
                    <td>${new Date(req.request_date).toLocaleDateString()}</td>
                    <td>${req.return_date ? new Date(req.return_date).toLocaleDateString() : 'Pending'}</td>
                    <td><span class="status ${req.status}">${req.status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Failed to load requests", error);
        }
    };

    window.requestBook = async (bookId) => {
        try {
            await apiFetch('/requests', {
                method: 'POST',
                body: JSON.stringify({ book_id: bookId })
            });
            alert('Book requested successfully!');
            loadBooks();
            loadRequests();
        } catch (error) {
            alert(error.message);
        }
    };

    // Notifications
    const loadNotifications = async () => {
        try {
            const notifs = await apiFetch('/notifications');
            const unread = notifs.filter(n => !n.read);
            
            const badge = document.getElementById('notif-badge');
            if (unread.length > 0) {
                badge.textContent = unread.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            const notifList = document.getElementById('notif-list');
            notifList.innerHTML = '';
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.style.padding = '0.5rem';
                div.style.borderBottom = '1px solid var(--border)';
                div.style.color = n.read ? 'var(--text-muted)' : 'white';
                div.innerHTML = `
                    <p>${n.message}</p>
                    <small>${new Date(n.created_at).toLocaleString()}</small>
                    ${!n.read ? `<button class="secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; margin-top: 0.5rem; width: auto;" onclick="markRead('${n.id}')">Mark Read</button>` : ''}
                `;
                notifList.appendChild(div);
            });

        } catch (error) {
            console.error(error);
        }
    };

    window.markRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
            loadNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const notifModal = document.getElementById('notif-modal');
    document.getElementById('notification-btn').addEventListener('click', () => {
        notifModal.classList.remove('hidden');
    });
    document.getElementById('close-notif-btn').addEventListener('click', () => {
        notifModal.classList.add('hidden');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    // Initial Load
    loadBooks();
    loadRequests();
    loadNotifications();

    // Poll notifications every 30s
    setInterval(loadNotifications, 30000);
});
