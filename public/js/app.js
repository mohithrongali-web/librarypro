// ======================== DATABASES ========================
let studentDatabase = [];
let librarianDatabase = [];

function initLibrarians() {
    if (librarianDatabase.length === 0) {
        librarianDatabase.push({ id: 1, name: "Dr. Meera Sharma", email: "meera@studypal.edu", password: "meera123", phone: "+91 98765 43210", join_date: "2024-01-15" });
        librarianDatabase.push({ id: 2, name: "Prof. Rajesh Kumar", email: "rajesh@studypal.edu", password: "rajesh123", phone: "+91 98765 43211", join_date: "2024-02-20" });
    }
}

// ======================== MOCK DATA ========================
let mockBooks = [
    { id: 1, title: "The Pragmatic Programmer", author: "David Thomas", category: "Computer Science", rack_location: "Rack A-2", cover_url: "https://picsum.photos/id/20/100/140", available_copies: 2, total_copies: 3, isbn: "978-0201616224", publication_year: "1999", description: "A classic guide.", publisher: "Addison-Wesley", pages: 352 },
    { id: 2, title: "Clean Code", author: "Robert Martin", category: "Programming", rack_location: "Rack B-1", cover_url: "https://picsum.photos/id/26/100/140", available_copies: 1, total_copies: 2, isbn: "978-0132350884", publication_year: "2008", description: "Writing clean code.", publisher: "Prentice Hall", pages: 464 },
    { id: 3, title: "Atomic Habits", author: "James Clear", category: "Self Help", rack_location: "Rack C-3", cover_url: "https://picsum.photos/id/0/100/140", available_copies: 0, total_copies: 1, isbn: "978-0735211292", publication_year: "2018", description: "Tiny changes.", publisher: "Penguin", pages: 320 }
];

let mockTransactions = [];
let mockNews = [];
let mockFacultyRequests = [];
let mockStudyRooms = [];

function initializeData() {
    mockTransactions = [
        { id: 101, student_id: 1001, book_id: 1, status: "approved", borrow_date: "2025-03-01", due_date: "2025-03-16", return_date: null, student_name: "Aarav Sharma", student_roll_number: "CS2024001", book_title: "The Pragmatic Programmer", book_author: "David Thomas" }
    ];
    
    mockNews = [
        { id: 1, title: "🎉 Welcome to StudyPal 2.0", content: "New features applied!", created_at: new Date().toISOString(), created_by: "Admin", priority: "high" }
    ];
    
    mockFacultyRequests = [];
    
    mockStudyRooms = [
        { id: 1, name: "Seminar Hall A", capacity: 20, available: true, time_slots: ["9AM-12PM", "2PM-5PM"], facilities: ["Projector"] },
        { id: 2, name: "Group Study Room B", capacity: 6, available: true, time_slots: ["10AM-1PM", "3PM-6PM"], facilities: ["Whiteboard"] }
    ];
    
    if (studentDatabase.length === 0) {
        studentDatabase.push({ id: 1001, rollNumber: "CS2024001", password: "student123", name: "Aarav Sharma", email: "aarav@studypal.edu", phone: "+91 98765 43210", department: "Computer Science", joined_date: "2024-08-15", total_borrowed: 1, fines: 0 });
    }
}

let nextTransactionId = 104;
let nextBookId = 4;
let nextNewsId = 2;
let nextFacultyRequestId = 1;

let currentStudent = null;
let currentLibrarian = null;
let userRole = null;

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

function computeStats() {
    return { 
        total_books: mockBooks.reduce((s,b)=>s+b.total_copies,0), 
        currently_borrowed: mockTransactions.filter(t=>t.status==='approved'&&!t.return_date).length, 
        overdue: 0, 
        pending_requests: mockTransactions.filter(t=>t.status==='pending').length, 
        total_students: studentDatabase.length, 
        total_librarians: librarianDatabase.length, 
        total_faculty_requests: mockFacultyRequests.length, 
        available_books: mockBooks.reduce((s,b)=>s+b.available_copies,0) 
    };
}

// Mock Axios
const originalGet = axios.get;
const originalPost = axios.post;

axios.get = async function(url, config) {
    if (url.startsWith('/api/auth')) return originalGet(url, config); // Bypass mock for auth
    
    await delay(200);

    const token = localStorage.getItem('token');
    const authHeaders = { Authorization: `Bearer ${token}` };

    if (url === '/api/transactions/stats') return originalGet('/api/librarian/stats', { headers: authHeaders });
    if (url === '/api/transactions/pending') return originalGet('/api/librarian/transactions/pending', { headers: authHeaders });
    if (url === '/api/transactions/overdue') return originalGet('/api/librarian/transactions/overdue', { headers: authHeaders });
    if (url === '/api/transactions/all') return originalGet('/api/librarian/transactions/all', { headers: authHeaders });
    if (url === '/api/students/all') return originalGet('/api/librarian/students/all', { headers: authHeaders });
    if (url === '/api/librarians/all') return originalGet('/api/librarian/librarians/all', { headers: authHeaders });
    
    if (url === '/api/faculty-requests') return originalGet('/api/faculty-requests', { headers: authHeaders });
    if (url === '/api/study-rooms') return originalGet('/api/study-rooms', { headers: authHeaders });
    
    // Fallbacks for mocks we didn't migrate yet
    if (url === '/api/news') {
        try {
            const res = await originalGet('/api/notifications', { headers: authHeaders });
            const notifications = res.data;
            if(notifications && notifications.length > 0) {
                return { data: notifications.map(n => ({ id: n.id, title: n.message, created_at: n.created_at, created_by: 'System' })) };
            }
        } catch(e) {}
        return { data: [...mockNews].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    
    if (url === '/api/books') {
        const res = await originalGet('/api/books', { headers: authHeaders });
        mockBooks = res.data;
        return { data: res.data };
    }

    if (url === '/api/student/borrowed') {
        const res = await originalGet('/api/requests', { headers: authHeaders });
        const mapped = res.data.map(r => ({ ...r, student_roll_number: r.roll_no, due_date: r.return_date }));
        return { data: mapped.filter(t => t.status === 'approved') };
    }
    if (url === '/api/student/history') {
        const res = await originalGet('/api/requests', { headers: authHeaders });
        return { data: res.data };
    }
    
    if (url.startsWith('/api/books/search')) {
        const query = new URLSearchParams(url.split('?')[1]).get('q') || '';
        const res = await originalGet('/api/books', { headers: authHeaders });
        const filtered = res.data.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()) || b.category.toLowerCase().includes(query.toLowerCase()));
        return { data: filtered };
    }
    if (url === '/api/student/profile') return { data: currentStudent };
    
    // Inject headers for any un-mocked requests as well
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
    return originalGet(url, config);
};

axios.post = async function(url, data, config) {
    if (url.startsWith('/api/auth')) return originalPost(url, data, config); // DO NOT MOCK REAL LOGIN!

    await delay(300);
    const token = localStorage.getItem('token');
    const authHeaders = { Authorization: `Bearer ${token}` };

    if (url.match(/\/transactions\/.+\/action$/)) {
        const transactionId = url.split('/')[3];
        const reqAction = data.action === 'approve' ? 'approved' : 'rejected';
        // Hit real endpoint
        await originalPost(`/api/librarian/transactions/${transactionId}/action`, { action: data.action }, { headers: authHeaders });
        return { data: { success: true } };
    }
    
    if (url === '/api/study-room/book') {
        await originalPost('/api/study-rooms/book', data, { headers: authHeaders });
        return { data: { success: true } };
    }

    if (url === '/api/faculty-request') {
        await originalPost('/api/faculty-requests', data, { headers: authHeaders });
        return { data: { success: true } };
    }

    if (url === '/api/student/borrow') {
        const bookId = data.book_id;
        const res = await originalPost('/api/requests', { book_id: bookId }, { headers: authHeaders });
        return { data: res.data.request };
    }

    if (url === '/api/student/return') {
        const transactionId = data.transaction_id;
        await axios.put(`/api/requests/${transactionId}`, { status: 'returned' }, { headers: authHeaders });
        return { data: { success: true } };
    }

    if (!config) config = {};
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
    return originalPost(url, data, config);
};

function showToast(message, type = "error") {
    Toastify({ text: message, duration: 3000, gravity: "top", position: "right", backgroundColor: type === "success" ? "#10B981" : "#EF4444", stopOnFocus: true, style: { borderRadius: "20px", fontSize: "14px" } }).showToast();
}

let newsInterval = null;

// ======================== LOGIN ========================
let loginActiveRole = "student";

function renderLogin() {
    const isStudent = loginActiveRole === "student";
    const html = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-white to-purple-100">
            <div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden md:flex fade-up">
                <div class="md:w-1/2 bg-gradient-to-br from-indigo-700 to-purple-700 p-8 text-white flex flex-col justify-between">
                    <div>
                        <i class="fas fa-book-open text-5xl mb-4"></i>
                        <h1 class="text-3xl font-bold">Study<span class="text-indigo-200">Pal</span></h1>
                        <p class="text-indigo-100 mt-2">Complete Library Management System</p>
                    </div>
                    <div class="mt-8 space-y-2 text-sm">
                        <p>✓ Student: Any roll number + min 6 char password</p>
                        <p>✓ Librarian: Any email + min 6 char password</p>
                        <p>✓ Auto-registration for both roles</p>
                        <p>✓ Detailed statistics & analytics</p>
                        <p>✓ Book location popups with full details</p>
                    </div>
                </div>
                <div class="md:w-1/2 p-8">
                    <div class="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                        <button id="studentTabBtn" class="px-6 py-2 rounded-lg font-semibold transition ${isStudent ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}">🎓 Student</button>
                        <button id="librarianTabBtn" class="px-6 py-2 rounded-lg font-semibold transition ${!isStudent ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}">📚 Librarian</button>
                    </div>
                    <h2 class="text-2xl font-bold">${isStudent ? 'Student Access' : 'Librarian Registration/Login'}</h2>
                    <p class="text-gray-500 text-sm mt-1">${isStudent ? 'Enter your credentials to continue' : 'Create new account or login with existing'}</p>
                    <form id="loginForm" class="mt-6 space-y-4">
                        ${isStudent ? `
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Roll Number</label><input type="text" id="rollNumber" placeholder="e.g., CS2024001" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Password (min 6 characters)</label><input type="password" id="studentPassword" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Full Name (optional)</label><input type="text" id="studentName" placeholder="Your full name" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                        ` : `
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" id="librarianEmail" placeholder="yourname@studypal.edu" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Password (min 6 characters)</label><input type="password" id="librarianPassword" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-1">Full Name (optional)</label><input type="text" id="librarianName" placeholder="Your full name" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none transition"></div>
                        `}
                        <button type="submit" id="submitBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-2">${isStudent ? '🔐 Sign In / Register' : '📘 Login / Register'}</button>
                    </form>
                    <div class="mt-6 text-center text-xs text-gray-400">
                        <i class="fas fa-shield-alt"></i> StudyPal - Your Smart Library Companion
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('app-root').innerHTML = html;
    
    document.getElementById('studentTabBtn')?.addEventListener('click', () => { loginActiveRole = 'student'; renderLogin(); });
    document.getElementById('librarianTabBtn')?.addEventListener('click', () => { loginActiveRole = 'librarian'; renderLogin(); });
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
}

// REAL BACKEND INTEGRATION
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    
    try {
        if (loginActiveRole === 'student') {
            const roll = document.getElementById('rollNumber')?.value.trim();
            const pwd = document.getElementById('studentPassword')?.value.trim();
            const name = document.getElementById('studentName')?.value.trim();
            if (!roll || !pwd) return showToast("Please enter roll number and password");
            if (pwd.length < 6) return showToast("Password must be at least 6 characters");
            
            const payload = { email: `${roll}@studypal.local`, password: pwd, role: 'student', roll_no: roll, name: name };
            btn.innerHTML = 'Authenticating...';
            btn.disabled = true;

            let userData;
            try {
                const res = await axios.post('/api/auth/login', { email: payload.email, password: pwd, role: 'student' });
                userData = res.data;
            } catch (loginError) {
                if (loginError.response?.data?.message?.includes('User not found')) {
                    showToast("Creating new account...", "success");
                    await axios.post('/api/auth/register', payload);
                    const retryRes = await axios.post('/api/auth/login', { email: payload.email, password: pwd, role: 'student' });
                    userData = retryRes.data;
                } else {
                    throw loginError;
                }
            }

            currentStudent = { id: userData.id, rollNumber: userData.roll_no, name: userData.name, email: userData.email, department: "Computer Science", joined_date: new Date().toISOString().slice(0,10), phone: "+91 0000 0000" };
            userRole = "student";
            localStorage.setItem('token', userData.accessToken);
            showToast(`🎉 Welcome ${currentStudent.name}!`, "success");
            refreshStudentDashboard();

        } else {
            // Librarian
            const email = document.getElementById('librarianEmail')?.value.trim();
            const pwd = document.getElementById('librarianPassword')?.value.trim();
            const name = document.getElementById('librarianName')?.value.trim();
            if (!email || !pwd) return showToast("Please enter email and password");
            
            const payload = { email, password: pwd, role: 'librarian', name: name };
            btn.innerHTML = 'Authenticating...';
            btn.disabled = true;

            let userData;
            try {
                const res = await axios.post('/api/auth/login', { email, password: pwd, role: 'librarian' });
                userData = res.data;
            } catch (loginError) {
                if (loginError.response?.data?.message?.includes('User not found')) {
                    showToast("Registering Librarian...", "success");
                    await axios.post('/api/auth/register', payload);
                    const retryRes = await axios.post('/api/auth/login', { email, password: pwd, role: 'librarian' });
                    userData = retryRes.data;
                } else {
                    throw loginError;
                }
            }

            currentLibrarian = { id: userData.id, name: userData.name, email: userData.email };
            userRole = "librarian";
            localStorage.setItem('token', userData.accessToken);
            showToast(`Welcome Librarian ${currentLibrarian.name}!`, "success");
            refreshLibrarianDashboard();
        }
    } catch (error) {
        showToast(error.response?.data?.message || "Authentication failed");
        btn.innerHTML = 'Sign In / Register';
        btn.disabled = false;
    }
}

// ======================== STUDENT DASHBOARD ========================
let activeStudentTab = "browse";
let allBooks = [];
let searchQuery = "";
let borrowedBooks = [];
let studentHistory = [];
let studentNews = [];
let studyRooms = [];
let facultyRequests = [];

async function fetchStudentAll() {
    try {
        const [books, borrowed, history, news, rooms, requests] = await Promise.all([
            axios.get('/api/books').then(r=>r.data),
            axios.get('/api/student/borrowed').then(r=>r.data),
            axios.get('/api/student/history').then(r=>r.data),
            axios.get('/api/news').then(r=>r.data),
            axios.get('/api/study-rooms').then(r=>r.data),
            axios.get('/api/faculty-requests').then(r=>r.data)
        ]);
        allBooks = books; 
        borrowedBooks = borrowed; 
        studentHistory = history; 
        studentNews = news; 
        studyRooms = rooms; 
        facultyRequests = requests;
    } catch(e) { console.error("Sync error:", e); }
}

async function refreshStudentDashboard() {
    await fetchStudentAll();
    renderStudentDashboard();
}

function escapeHtml(str) { 
    if(!str) return ''; 
    return str.toString().replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); 
}

function showBookModal(book) {
    const isBorrowedByMe = borrowedBooks.find(b => b.book_id === book.id);
    const isPendingForMe = studentHistory.find(b => b.book_id === book.id && b.status === 'pending');
    
    let actionBtnHtml = '';
    
    if (isBorrowedByMe) {
        actionBtnHtml = `<button onclick="handleReturn('${isBorrowedByMe.id}'); closeModal()" class="flex-1 bg-rose-500 text-white py-2 rounded-xl font-semibold hover:bg-rose-600 transition shadow-md"><i class="fas fa-undo"></i> Return My Book</button>`;
    } else if (isPendingForMe) {
        actionBtnHtml = `<button disabled class="flex-1 bg-yellow-400 text-white py-2 rounded-xl font-semibold cursor-not-allowed shadow-inner"><i class="fas fa-clock"></i> Request Pending</button>`;
    } else if (book.available === false || book.available_copies <= 0) {
        actionBtnHtml = `<button disabled class="flex-1 bg-gray-300 text-gray-500 py-2 rounded-xl cursor-not-allowed">Unavailable (Checked Out)</button>`;
    } else {
        actionBtnHtml = `<button id="modalBorrowBtn" data-book-id="${book.id}" class="flex-1 bg-emerald-500 text-white py-2 rounded-xl font-semibold hover:bg-emerald-600 shadow-md transition"><i class="fas fa-book"></i> Request Borrow</button>`;
    }

    const modalHtml = `
        <div id="bookModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onclick="if(event.target===this) closeModal()">
            <div class="bg-white rounded-2xl max-w-md w-full p-6 slide-up shadow-2xl">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-bold text-gray-800">${escapeHtml(book.title)}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="space-y-3 detail-modal">
                    <p><i class="fas fa-user text-indigo-500 w-6"></i> <strong>Author:</strong> ${escapeHtml(book.author)}</p>
                    <p><i class="fas fa-tag text-indigo-500 w-6"></i> <strong>Category:</strong> ${escapeHtml(book.category)}</p>
                    <p><i class="fas fa-map-marker-alt text-red-500 w-6"></i> <strong>Location:</strong> <span class="bg-yellow-100 px-2 py-1 rounded font-mono text-sm">${escapeHtml(book.rack_location || 'Not Placed')}</span></p>
                    <p><i class="fas fa-barcode text-indigo-500 w-6"></i> <strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                    <p><i class="fas fa-calendar text-indigo-500 w-6"></i> <strong>Year:</strong> ${book.publication_year || 'N/A'}</p>
                    <p><i class="fas fa-book-open text-indigo-500 w-6"></i> <strong>Pages:</strong> ${book.pages || 'N/A'}</p>
                    <p><i class="fas fa-align-left text-indigo-500 w-6"></i> <strong>Description:</strong> ${book.description || 'No description'}</p>
                    <p><i class="fas fa-copy text-green-600 w-6"></i> <strong>Copies:</strong> ${book.available_copies}/${book.total_copies}</p>
                </div>
                <div class="mt-6 flex gap-3">
                    ${actionBtnHtml}
                    <button onclick="closeModal()" class="px-4 py-2 border rounded-xl hover:bg-gray-50">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('modalBorrowBtn')?.addEventListener('click', async () => {
        const bookId = document.getElementById('modalBorrowBtn').dataset.bookId;
        closeModal();
        await handleBorrow(bookId);
    });
    window.closeModal = () => { document.getElementById('bookModal')?.remove(); };
}

async function handleBorrow(bookId) {
    try {
        await axios.post('/api/student/borrow', { book_id: bookId });
        showToast("📚 Borrow request sent!", "success");
        await refreshStudentDashboard();
    } catch(e) { showToast(e.response?.data?.message || e.response?.data?.detail || "Cannot borrow book"); }
}

async function handleReturn(transactionId) {
    try {
        await axios.post('/api/student/return', { transaction_id: transactionId });
        showToast("✅ Book returned!", "success");
        await refreshStudentDashboard();
    } catch(e) { showToast("Return failed"); }
}

async function handleFacultyRequest(e) {
    e.preventDefault();
    const title = document.getElementById('facultyBookTitle')?.value;
    const reason = document.getElementById('facultyReason')?.value;
    if (!title) return showToast("Enter book title");
    await axios.post('/api/faculty-request', { faculty_name: currentStudent.name, department: currentStudent.department, book_title: title, reason: reason || "" });
    showToast("Request sent", "success");
    refreshStudentDashboard();
}

async function handleRoomBooking(roomId) {
    try {
        await axios.post('/api/study-room/book', { room_id: roomId });
        showToast("Room requested! Awaiting approval.", "success");
        refreshStudentDashboard();
    } catch(e) { showToast("Could not book room"); }
}

function renderStudentDashboard() {
    const root = document.getElementById('app-root');
    
    const newsBar = `<div class="floating-news fixed top-0 left-0 right-0 z-40 py-2.5 px-4 shadow-lg"><div class="container mx-auto flex items-center gap-3 overflow-hidden"><i class="fas fa-bullhorn text-white text-lg"></i><div id="newsTicker" class="text-white text-sm font-medium truncate">✨ ${studentNews[0]?.title || "Welcome to StudyPal"}</div></div></div>`;
    const topMargin = "pt-14";
    
    const tabs = [
        { id: "browse", icon: "fa-book", label: "Browse Books" },
        { id: "borrowed", icon: "fa-book-reader", label: "My Books" },
        { id: "rooms", icon: "fa-door-open", label: "Study Rooms" },
        { id: "faculty", icon: "fa-chalkboard-teacher", label: "Faculty Request" },
        { id: "profile", icon: "fa-user", label: "Profile" }
    ];
    
    let content = "";
    if (activeStudentTab === "browse") {
        content = `
            <div class="mb-6 flex flex-col sm:flex-row gap-3"><div class="relative flex-1"><i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i><input id="searchInput" type="text" placeholder="Search by title, author, category..." class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-300 outline-none" value="${searchQuery}"></div><button id="searchBtn" class="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 transition"><i class="fas fa-search"></i> Search</button></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">${allBooks.map(book => `
                <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm book-card" onclick='showBookModal(${JSON.stringify(book).replace(/'/g, "&#39;")})'>
                    <img src="${book.cover_url}" class="w-full h-40 object-cover rounded-lg mb-3" onerror="this.src='https://picsum.photos/id/1/100/140'">
                    <h3 class="font-bold text-gray-800">${escapeHtml(book.title)}</h3>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${book.category}</span>
                        <span class="text-xs font-semibold ${book.available !== false ? 'text-green-600' : 'text-red-500'}">
                            <i class="fas fa-circle"></i> ${book.available !== false ? 'Available' : 'Checked Out'}
                        </span>
                    </div>
                    <div class="mt-2 text-xs text-gray-400"><i class="fas fa-map-marker-alt"></i> ${book.rack_location || 'Not Assigned'}</div>
                </div>
            `).join('')}</div>`;
    } else if (activeStudentTab === "borrowed") {
        content = borrowedBooks.length === 0 ? `<div class="bg-white rounded-2xl p-12 flex flex-col items-center border border-dashed border-gray-300"><div class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><i class="fas fa-book-open text-4xl text-indigo-400"></i></div><h3 class="text-xl font-bold text-gray-800 mb-2">No borrowed books yet</h3><p class="text-gray-500 text-center max-w-sm mb-6">You haven't borrowed any books. Explore our vast library collection and find your next great read!</p><button onclick="document.querySelector('[data-student-tab=\\'browse\\']').click()" class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"><i class="fas fa-search mr-2"></i>Browse Library</button></div>` : 
            `<div class="space-y-3">${borrowedBooks.map(b => `<div class="bg-white rounded-xl border p-4 flex flex-wrap justify-between items-center"><div><h3 class="font-bold">${escapeHtml(b.book_title)}</h3><p class="text-xs text-gray-500"><i class="fas fa-calendar-alt"></i> Due: ${b.due_date ? new Date(b.due_date).toLocaleDateString() : 'N/A'}</p></div><button data-transaction="${b.id}" class="return-btn bg-rose-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-rose-600 transition shadow-sm"><i class="fas fa-undo-alt mr-1"></i> Return Book</button></div>`).join('')}</div>`;
    } else if (activeStudentTab === "rooms") {
        content = `<div class="grid md:grid-cols-2 gap-4">${studyRooms.map(room => `
            <div class="bg-white rounded-xl border p-5"><i class="fas fa-door-open text-2xl text-indigo-500 mb-2"></i><h3 class="font-bold text-lg">${room.name}</h3><p>👥 Capacity: ${room.capacity} people</p><p class="text-sm"><i class="fas fa-wifi"></i> Facilities: ${Array.isArray(room.facilities) ? room.facilities.join(', ') : (room.facilities || 'Basic')}</p><p class="text-sm">${room.available ? '<span class="text-green-600"><i class="fas fa-check-circle"></i> Available</span>' : '<span class="text-red-500"><i class="fas fa-times-circle"></i> Booked</span>'}</p>${room.available ? `<button onclick="handleRoomBooking(${room.id})" class="mt-3 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-600"><i class="fas fa-calendar-check"></i> Book Now</button>` : ''}</div>
        `).join('')}</div>`;
    } else if (activeStudentTab === "faculty") {
        content = `
            <div class="bg-white rounded-xl border p-6 max-w-2xl"><h3 class="font-bold text-xl mb-4"><i class="fas fa-chalkboard-teacher text-indigo-500"></i> Faculty Book Request</h3><p class="text-sm text-gray-600 mb-4">Request new books for your department or research</p><form id="facultyRequestForm"><input id="facultyBookTitle" placeholder="Book Title / ISBN" class="w-full border rounded-xl p-3 mb-3 focus:ring-2 focus:ring-indigo-300 outline-none"><textarea id="facultyReason" placeholder="Reason for request (optional)" class="w-full border rounded-xl p-3 mb-3 focus:ring-2 focus:ring-indigo-300 outline-none" rows="2"></textarea><button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"><i class="fas fa-paper-plane"></i> Submit Request</button></form><div class="mt-6"><h4 class="font-semibold mb-2">Recent Requests</h4>${facultyRequests.slice(0,3).map(r => `<div class="border-l-4 border-indigo-300 pl-3 py-2 mt-2"><p class="text-sm">📚 ${r.book_title}</p><p class="text-xs text-gray-500">Status: ${r.status} | ${r.request_date}</p></div>`).join('')}</div></div>`;
    } else {
        content = `<div class="bg-white rounded-2xl border p-6 max-w-2xl"><div class="flex items-center gap-5"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold">${currentStudent?.name?.charAt(0) || 'S'}</div><div><h2 class="text-2xl font-bold">${currentStudent?.name}</h2><p class="text-indigo-600"><i class="fas fa-id-card"></i> ${currentStudent?.rollNumber}</p></div></div><div class="grid grid-cols-2 gap-4 mt-6"><div><label class="text-xs text-gray-400">Email</label><p class="text-sm">${currentStudent?.email}</p></div><div><label class="text-xs text-gray-400">Phone</label><p class="text-sm">${currentStudent?.phone}</p></div><div><label class="text-xs text-gray-400">Department</label><p class="text-sm">${currentStudent?.department}</p></div><div><label class="text-xs text-gray-400">Member Since</label><p class="text-sm">${currentStudent?.joined_date}</p></div><div><label class="text-xs text-gray-400">Active Borrows</label><p class="text-sm">${borrowedBooks.length}</p></div><div><label class="text-xs text-gray-400">Total Reads</label><p class="text-sm">${studentHistory.filter(t=>t.status==='returned').length}</p></div></div></div>`;
    }
    
    const desktopNav = `<div class="desktop-nav hidden md:flex gap-2 bg-white/80 backdrop-blur rounded-full p-1 shadow-sm">${tabs.map(tab => `<button data-student-tab="${tab.id}" class="nav-tab px-5 py-2 rounded-full text-sm font-medium transition ${activeStudentTab===tab.id?'active bg-indigo-50 text-indigo-600':'text-gray-600 hover:bg-gray-100'}"><i class="fas ${tab.icon} mr-2"></i>${tab.label}</button>`).join('')}</div>`;
    const mobileNav = `<div class="mobile-bottom-nav md:hidden">${tabs.map(tab => `<button data-student-tab="${tab.id}" class="flex flex-col items-center text-xs ${activeStudentTab===tab.id?'text-indigo-600 font-bold':'text-gray-500'}"><i class="fas ${tab.icon} text-xl"></i><span>${tab.label.split(' ')[0]}</span></button>`).join('')}</div>`;
    
    const fullHtml = `${newsBar}<div class="${topMargin}"><div class="sticky top-14 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 shadow-sm"><div class="container mx-auto flex flex-wrap justify-between items-center gap-3"><h2 class="text-xl font-bold text-gray-800"><i class="fas fa-graduation-cap text-indigo-500"></i> StudyPal | Welcome, ${currentStudent?.name}</h2>${desktopNav}<button id="logoutBtn" class="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm hover:bg-red-100 transition"><i class="fas fa-sign-out-alt"></i> Logout</button></div></div>
    <div class="container mx-auto px-4 py-6 main-padding">
        ${content}
    </div>${mobileNav}</div>`;
    root.innerHTML = fullHtml;
    
    document.querySelectorAll('[data-student-tab]').forEach(btn => btn.addEventListener('click', (e) => { activeStudentTab = btn.getAttribute('data-student-tab'); refreshStudentDashboard(); }));
    document.getElementById('searchBtn')?.addEventListener('click', async () => { searchQuery = document.getElementById('searchInput')?.value || ''; await searchBooks(); });
    document.getElementById('searchInput')?.addEventListener('keypress', async (e) => { if(e.key === 'Enter') { searchQuery = e.target.value; await searchBooks(); } });
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('facultyRequestForm')?.addEventListener('submit', handleFacultyRequest);
    document.querySelectorAll('.return-btn').forEach(btn => btn.addEventListener('click', () => handleReturn(btn.dataset.transaction)));
}

async function searchBooks() {
    try { const res = await axios.get(`/api/books/search?q=${encodeURIComponent(searchQuery)}`); allBooks = res.data; renderStudentDashboard(); } catch(e){}
}

function startNewsTicker() {
    if (newsInterval) clearInterval(newsInterval);
    let idx = 0;
    const update = () => {
        const ticker = document.getElementById('newsTicker');
        if (ticker && studentNews.length) { ticker.innerHTML = `✨ ${studentNews[idx % studentNews.length].title}`; idx++; }
    };
    update();
    newsInterval = setInterval(update, 5000);
}

// ======================== LIBRARIAN DASHBOARD ========================
let librarianStats = {};
let pendingRequests = [];
let overdueBooks = [];
let librarianNews = [];
let allStudents = [];
let allLibrarians = [];
let allTransactions = [];
let activeLibrarianTab = "dashboard";
let pendingRooms = [];

async function refreshLibrarianDashboard() {
    try {
        librarianStats = (await axios.get('/api/librarian/stats')).data;
        pendingRequests = (await axios.get('/api/librarian/transactions/pending')).data;
        overdueBooks = (await axios.get('/api/librarian/transactions/overdue')).data;
        librarianNews = (await axios.get('/api/news')).data;
        allStudents = (await axios.get('/api/librarian/students/all')).data;
        allLibrarians = (await axios.get('/api/librarian/librarians/all')).data;
        allTransactions = (await axios.get('/api/librarian/transactions/all')).data;
        studyRooms = (await axios.get('/api/study-rooms')).data;
        pendingRooms = (await axios.get('/api/study-rooms/pending')).data;
        facultyRequests = (await axios.get('/api/faculty-requests')).data;
        renderLibrarianDashboard();
    } catch(e) { console.error(e); }
}

async function librarianHandleAction(id, action) { 
    try {
        await axios.post(`/api/transactions/${id}/action`, { action }); 
        await refreshLibrarianDashboard(); 
        showToast(`${action}d request`, "success"); 
    } catch(e) { showToast("Action failed"); }
}

async function addBookLibrarian(e) { 
    e.preventDefault(); 
    const formData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        category: document.getElementById('bookCategory').value,
        rack_location: document.getElementById('bookRack').value,
        cover_url: "https://picsum.photos/id/1/100/140",
        isbn: document.getElementById('bookIsbn')?.value || "N/A",
        publication_year: document.getElementById('bookYear')?.value || "2024",
        publisher: document.getElementById('bookPublisher')?.value || "StudyPal Press",
        pages: parseInt(document.getElementById('bookPages')?.value) || 200
    };
    await axios.post('/api/books', formData); 
    await refreshLibrarianDashboard(); 
    showToast("Book added successfully!", "success"); 
    e.target.reset();
}

async function addNewsLibrarian(e) { 
    e.preventDefault(); 
    const title = document.getElementById('newsTitleLib').value; 
    const content = document.getElementById('newsContentLib').value; 
    await axios.post('/api/news', { title, content }); 
    await refreshLibrarianDashboard(); 
    showToast("News posted successfully!", "success"); 
    e.target.reset();
}

function showLibrarianStatDetails(statType, value) {
    let title = "", details = [];
    if (statType === "total_books") {
        title = `📚 All Books in Library (${value})`;
        details = mockBooks.map(b => `${b.title} by ${b.author} - ${b.available_copies}/${b.total_copies} available | Location: ${b.rack_location} | ISBN: ${b.isbn}`);
    } else if (statType === "currently_borrowed") {
        title = `📖 Currently Borrowed Books (${value})`;
        details = allTransactions.filter(t => t.status === 'approved' && !t.return_date).map(t => `${t.book_title} - ${t.student_name} (${t.student_roll_number}) | Borrowed: ${t.borrow_date} | Due: ${t.due_date}`);
    } else if (statType === "overdue") {
        title = `⚠️ Overdue Books (${value})`;
        details = overdueBooks.map(t => `${t.book_title} - ${t.student_name} (${t.student_roll_number}) | Due: ${t.due_date}`);
    } else if (statType === "pending_requests") {
        title = `⏳ Pending Borrow Requests (${value})`;
        details = pendingRequests.map(t => `${t.student_name} (${t.student_roll_number}) requested "${t.book_title}" on ${new Date(t.request_date).toLocaleDateString()}`);
    } else if (statType === "total_students") {
        title = `👥 All Registered Students (${value})`;
        details = allStudents.map(s => `${s.name} (${s.rollNumber}) - ${s.department} | Joined: ${s.joined_date} | Books Borrowed: ${mockTransactions.filter(t => t.student_id === s.id && t.status === 'approved' && !t.return_date).length}`);
    } else if (statType === "available_books") {
        title = `📚 Available Books for Borrowing (${value})`;
        details = mockBooks.filter(b => b.available_copies > 0).map(b => `${b.title} by ${b.author} - ${b.available_copies} copies available at ${b.rack_location}`);
    } else if (statType === "study_rooms") {
        title = `🚪 Study Rooms Status (${value})`;
        details = studyRooms.map(r => `• ${r.name} - Capacity: ${r.capacity} remaining | Facilities: ${r.facilities} | Status: ${r.available ? 'Available' : 'Full'}`);
    } else if (statType === "faculty_requests") {
        title = `👨‍🏫 Faculty Requests (${value})`;
        details = facultyRequests.map(r => `• ${r.faculty_name} (${r.department}): "${r.book_title}" - Reason: ${r.reason || 'None'} [${r.status.toUpperCase()}]`);
    }
    
    const modalHtml = `
        <div id="detailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onclick="if(event.target===this) closeDetailModal()">
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col slide-up shadow-2xl">
                <div class="flex justify-between items-center p-4 border-b sticky top-0 bg-white rounded-t-2xl">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-4 overflow-y-auto detail-modal">
                    ${details.length > 0 ? details.map(d => `<div class="border-b border-gray-100 py-2 text-sm">• ${escapeHtml(d)}</div>`).join('') : '<p class="text-gray-500 text-center py-8">No data available</p>'}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
window.closeDetailModal = () => { document.getElementById('detailModal')?.remove(); };
}

async function handleLibrarianReturn(transactionId) {
    if (!confirm("Has the student physically returned this book?")) return;
    try {
        await axios.put(`/api/requests/${transactionId}`, { status: 'returned' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        showToast("Book marked as returned!", "success");
        refreshLibrarianDashboard();
    } catch(e) { showToast("Failed to mark returned"); }
}

function renderLibrarianDashboard() {
    const root = document.getElementById('app-root');
    
    const statCards = [
        { label: "Total Books", value: librarianStats.total_books, icon: "fa-book", color: "text-blue-500", statKey: "total_books" },
        { label: "Currently Borrowed", value: librarianStats.currently_borrowed, icon: "fa-book-reader", color: "text-green-500", statKey: "currently_borrowed" },
        { label: "Overdue", value: librarianStats.overdue, icon: "fa-exclamation-triangle", color: "text-red-500", statKey: "overdue" },
        { label: "Pending Requests", value: librarianStats.pending_requests, icon: "fa-clock", color: "text-yellow-500", statKey: "pending_requests" },
        { label: "Total Students", value: librarianStats.total_students, icon: "fa-users", color: "text-purple-500", statKey: "total_students" },
        { label: "Available Books", value: librarianStats.available_books, icon: "fa-check-circle", color: "text-emerald-500", statKey: "available_books" },
        { label: "Study Rooms", value: studyRooms.filter(r=>r.available).length, icon: "fa-door-open", color: "text-indigo-500", statKey: "study_rooms" },
        { label: "Faculty Requests", value: librarianStats.total_faculty_requests, icon: "fa-chalkboard-teacher", color: "text-pink-500", statKey: "faculty_requests" }
    ];
    
    const tabs = [
        { id: "dashboard", icon: "fa-chart-line", label: "Dashboard" },
        { id: "pending", icon: "fa-clock", label: "Pending Requests" },
        { id: "addbook", icon: "fa-plus-circle", label: "Add Book" },
        { id: "overdue", icon: "fa-exclamation-triangle", label: "Overdue" },
        { id: "news", icon: "fa-newspaper", label: "Post News" },
        { id: "students", icon: "fa-users", label: "Students" },
        { id: "transactions", icon: "fa-history", label: "Transactions" }
    ];
    
    let content = "";
    if (activeLibrarianTab === "dashboard") {
        content = `
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                ${statCards.map(s => `<div class="bg-white rounded-xl p-4 shadow-sm text-center stat-card hover:shadow-md transition cursor-pointer" onclick="showLibrarianStatDetails('${s.statKey}', ${s.value})"><i class="fas ${s.icon} text-2xl ${s.color} mb-2"></i><div class="text-xl font-bold text-gray-800">${s.value}</div><div class="text-xs text-gray-500">${s.label}</div><div class="text-[10px] text-gray-400 mt-1"><i class="fas fa-mouse-pointer"></i> click details</div></div>`).join('')}
            </div>
            <div class="grid lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl p-5 shadow-sm"><h3 class="font-bold text-lg mb-3"><i class="fas fa-clock text-yellow-500"></i> Recent Pending Requests</h3>${pendingRequests.slice(0,5).map(r => `<div class="border-b py-3"><div class="flex justify-between items-center"><div><p class="font-medium">${r.student_name}</p><p class="text-sm text-gray-500">${r.book_title}</p><p class="text-xs text-gray-400">Requested: ${new Date(r.request_date).toLocaleDateString()}</p></div><button class="bg-green-500 text-white px-3 py-1 rounded text-sm" data-id="${r.id}" data-act="approve"><i class="fas fa-check"></i> Approve</button></div></div>`).join('') || '<p class="text-gray-400 text-center py-4">No pending requests</p>'}</div>
                <div class="bg-white rounded-xl p-5 shadow-sm space-y-4">
                    <div><h3 class="font-bold text-lg mb-3"><i class="fas fa-door-open text-indigo-500"></i> Pending Room Bookings</h3>${pendingRooms.slice(0,5).map(r => `<div class="border-b py-2 flex justify-between items-center"><div><p class="font-medium text-sm">${r.student_name}</p><p class="text-xs text-gray-500">${r.room_name}</p></div><div><button class="text-green-500 border border-green-500 px-2 py-1 rounded text-xs hover:bg-green-50" onclick="approveRoomBooking('${r.id}', 'approve')">Approve</button></div></div>`).join('') || '<p class="text-gray-400 text-xs">No pending room bookings</p>'}</div>
                    <div><h3 class="font-bold text-lg mb-3"><i class="fas fa-newspaper text-purple-500"></i> Announcements</h3>${librarianNews.slice(0,5).map(n => `<div class="border-b py-2"><p class="font-medium text-sm">${n.title}</p><p class="text-xs text-gray-500">${new Date(n.created_at).toLocaleDateString()} by ${n.created_by}</p></div>`).join('')}</div>
                </div>
            </div>`;
    } else if (activeLibrarianTab === "pending") {
        content = `<div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-clock text-yellow-500"></i> Pending Borrow Requests</h3>${pendingRequests.length === 0 ? '<p class="text-gray-400 text-center py-8"><i class="fas fa-check-circle text-4xl mb-2"></i><br>No pending requests</p>' : pendingRequests.map(r => `
            <div class="border-b border-gray-100 py-4 flex flex-wrap justify-between items-center gap-3">
                <div><p class="font-semibold">${r.student_name}</p><p class="text-sm text-gray-500">${r.student_roll_number}</p><p class="text-sm"><i class="fas fa-book"></i> ${r.book_title}</p><p class="text-xs text-gray-400">Requested: ${new Date(r.request_date).toLocaleDateString()}</p></div>
                <div><button class="bg-green-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-green-600 transition" data-id="${r.id}" data-act="approve"><i class="fas fa-check"></i> Approve</button><button class="border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition" data-id="${r.id}" data-act="reject"><i class="fas fa-times"></i> Reject</button></div>
            </div>
        `).join('')}</div>`;
    } else if (activeLibrarianTab === "addbook") {
        content = `<div class="bg-white rounded-xl p-6 shadow-sm max-w-3xl mx-auto"><h3 class="font-bold text-xl mb-4"><i class="fas fa-plus-circle text-green-500"></i> Add New Book to Library</h3><form id="libAddBookForm" class="grid md:grid-cols-2 gap-4"><input id="bookTitle" placeholder="Book Title *" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required><input id="bookAuthor" placeholder="Author *" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required><input id="bookCategory" placeholder="Category *" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required><input id="bookRack" placeholder="Rack Location *" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required><input id="bookIsbn" placeholder="ISBN" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none"><input id="bookYear" placeholder="Publication Year" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none"><input id="bookPublisher" placeholder="Publisher" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none"><input id="bookPages" placeholder="Pages" class="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none"><button type="submit" class="md:col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"><i class="fas fa-save"></i> Add Book to Library</button></form></div>`;
    } else if (activeLibrarianTab === "overdue") {
        content = `<div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-exclamation-triangle text-red-500"></i> Overdue Books</h3>${overdueBooks.length === 0 ? '<p class="text-green-600 text-center py-8"><i class="fas fa-check-circle text-4xl mb-2"></i><br>No overdue books</p>' : overdueBooks.map(o => `<div class="border-b border-gray-100 py-3 flex justify-between items-center"><div><p class="font-semibold">${o.student_name} (${o.student_roll_number})</p><p class="text-sm">📖 ${o.book_title}</p><p class="text-xs text-red-500">Due Date: ${o.due_date}</p></div><button class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs shadow-sm" onclick="handleLibrarianReturn('${o.id}')"><i class="fas fa-undo"></i> Mark Returned</button></div>`).join('')}</div>`;
    } else if (activeLibrarianTab === "news") {
        content = `<div class="grid lg:grid-cols-2 gap-6"><div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-newspaper text-purple-500"></i> Post Library Announcement</h3><form id="libNewsForm" class="space-y-4"><input id="newsTitleLib" placeholder="News Title" class="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required><textarea id="newsContentLib" rows="4" placeholder="News Content" class="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 outline-none" required></textarea><button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"><i class="fas fa-paper-plane"></i> Post Announcement</button></form></div><div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-history"></i> Recent Announcements</h3><div class="space-y-3 max-h-96 overflow-y-auto">${librarianNews.map(n => `<div class="border-l-4 border-indigo-300 pl-3 py-2"><p class="font-semibold text-sm">${n.title}</p><p class="text-xs text-gray-500">${new Date(n.created_at).toLocaleDateString()} by ${n.created_by}</p><p class="text-sm mt-1">${n.content.substring(0, 100)}</p></div>`).join('')}</div></div></div>`;
    } else if (activeLibrarianTab === "students") {
        content = `<div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-users text-indigo-500"></i> All Registered Students</h3><div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50"><tr><th class="p-3 text-left">Name</th><th class="p-3 text-left">Roll Number</th><th class="p-3 text-left">Department</th><th class="p-3 text-left">Joined Date</th><th class="p-3 text-left">Phone</th><th class="p-3 text-left">Active Borrows</th></tr></thead><tbody>${allStudents.map(s => `<tr class="border-b"><td class="p-3">${s.name}</td><td class="p-3">${s.rollNumber}</td><td class="p-3">${s.department}</td><td class="p-3">${s.joined_date}</td><td class="p-3">${s.phone}</td><td class="p-3">${mockTransactions.filter(t => t.student_id === s.id && t.status === 'approved' && !t.return_date).length}</td></tr>`).join('')}</tbody></table></div></div>`;
    } else if (activeLibrarianTab === "transactions") {
        content = `<div class="bg-white rounded-xl p-6 shadow-sm"><h3 class="font-bold text-xl mb-4"><i class="fas fa-history text-gray-500"></i> Complete Transaction History</h3><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="p-3 text-left">Student</th><th class="p-3 text-left">Book</th><th class="p-3 text-left">Borrow Date</th><th class="p-3 text-left">Due Date</th><th class="p-3 text-left">Return Date</th><th class="p-3 text-left">Status</th><th class="p-3 text-left">Actions</th></tr></thead><tbody>${allTransactions.map(t => `<tr class="border-b"><td class="p-3">${t.student_name}<br><span class="text-xs text-gray-500">${t.student_roll_number}</span></td><td class="p-3">${t.book_title}</td><td class="p-3">${t.borrow_date || new Date(t.request_date).toLocaleDateString()}</td><td class="p-3">${t.due_date || (t.return_date ? new Date(t.return_date).toLocaleDateString() : '-')}</td><td class="p-3">${t.status === 'returned' ? new Date().toLocaleDateString() : '-'}</td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${t.status==='approved'?'bg-green-100 text-green-700':t.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100'}">${t.status}</span></td><td class="p-3">${t.status === 'approved' ? `<button class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs shadow-sm transition" onclick="handleLibrarianReturn('${t.id}')"><i class="fas fa-undo"></i> Mark Returned</button>` : `<span class="text-xs text-gray-400">None</span>`}</td></tr>`).join('')}</tbody></table></div></div>`;
    }
    
    const html = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-5 shadow-lg sticky top-0 z-40">
                <div class="container mx-auto flex flex-wrap justify-between items-center gap-3">
                    <div><h1 class="text-2xl font-bold"><i class="fas fa-chalkboard-teacher mr-2"></i>StudyPal | Librarian Portal</h1><p class="text-indigo-100 text-sm">${currentLibrarian?.name} | ${currentLibrarian?.email}</p></div>
                    <button id="libLogout" class="bg-white/20 px-5 py-2 rounded-full hover:bg-white/30 transition"><i class="fas fa-sign-out-alt"></i> Logout</button>
                </div>
            </div>
            <div class="container mx-auto p-5">
                <div class="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
                    ${tabs.map(tab => `<button data-lib-tab="${tab.id}" class="lib-nav-btn px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${activeLibrarianTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}"><i class="fas ${tab.icon} mr-2"></i>${tab.label}</button>`).join('')}
                </div>
                ${content}
            </div>
        </div>
    `;
    root.innerHTML = html;
    
    document.querySelectorAll('.lib-nav-btn').forEach(btn => btn.addEventListener('click', () => { activeLibrarianTab = btn.getAttribute('data-lib-tab'); refreshLibrarianDashboard(); }));
    document.querySelectorAll('[data-act="approve"]').forEach(btn => btn.addEventListener('click', () => librarianHandleAction(btn.dataset.id, 'approve')));
    document.querySelectorAll('[data-act="reject"]').forEach(btn => btn.addEventListener('click', () => librarianHandleAction(btn.dataset.id, 'reject')));
    document.getElementById('libAddBookForm')?.addEventListener('submit', addBookLibrarian);
    document.getElementById('libNewsForm')?.addEventListener('submit', addNewsLibrarian);
    document.getElementById('libLogout')?.addEventListener('click', handleLogout);
    window.showLibrarianStatDetails = showLibrarianStatDetails;
}

async function approveRoomBooking(id, action) {
    try {
        await axios.put(`/api/study-rooms/book/${id}`, { action });
        showToast("Room booking " + action + "d");
        await refreshLibrarianDashboard();
    } catch(e) { }
}

window.approveRoomBooking = approveRoomBooking;

window.handleLogout = function() {
    if(newsInterval) clearInterval(newsInterval); 
    userRole = null;
    currentStudent = null;
    currentLibrarian = null;
    localStorage.removeItem('token');
    renderLogin();
};

initLibrarians();
initializeData();
renderLogin();
