document.addEventListener('DOMContentLoaded', () => {
    const roleToggleBtns = document.querySelectorAll('.toggle-btn');
    const authForm = document.getElementById('magic-auth-form');
    const authMessage = document.getElementById('auth-message');
    const accessTitle = document.getElementById('access-title');
    
    // Form fields
    const groupRoll = document.getElementById('group-roll');
    const groupEmail = document.getElementById('group-email');
    const rollNoInput = document.getElementById('roll_no');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');
    const submitBtn = document.getElementById('submit-btn');

    let currentRole = 'student';

    // Existing Login Check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        window.location.href = user.role === 'student' ? '/student-dashboard.html' : '/librarian-dashboard.html';
    }

    // Role Toggle Logic
    roleToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;

            // Update UI based on Role
            if (currentRole === 'student') {
                groupRoll.classList.remove('hidden');
                groupEmail.classList.add('hidden');
                accessTitle.textContent = 'Student Access';
            } else {
                groupRoll.classList.add('hidden');
                groupEmail.classList.remove('hidden');
                accessTitle.textContent = 'Librarian Access';
            }
            authMessage.textContent = ''; // clear msg on switch
        });
    });

    const displayMsg = (msg, isError = true) => {
        authMessage.textContent = msg;
        authMessage.className = isError ? 'msg-error' : 'msg-success';
    };

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayMsg('', false);
        
        let email = '';
        let roll_no = '';
        
        if (currentRole === 'student') {
            roll_no = rollNoInput.value.trim();
            if(!roll_no) return displayMsg('Roll number is required.');
            // DUMMY EMAIL GENERATION for DB constraints
            // We use roll number as the core identifier, but fake the email required by Postgres
            email = `${roll_no}@studypal.local`;
        } else {
            email = emailInput.value.trim();
            if(!email) return displayMsg('Email is required.');
        }

        const password = passwordInput.value;
        const name = nameInput.value.trim(); // Optional!
        
        // Payload base
        const payload = { email, password, role: currentRole, roll_no, name };

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Authenticating...';

        try {
            // MAGIC LOGIC: Try to login first!
            try {
                const loginData = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password, role: currentRole })
                });

                // Success! It found an existing user.
                handleAuthSuccess(loginData);
                return; // exit early

            } catch (loginError) {
                // If the user doesn't exist explicitly, we will try to register them instead!
                // Since this acts as both login and register button.
                if (loginError.message.includes('User not found')) {
                    
                    submitBtn.innerHTML = 'Creating Account...';
                    
                    // Call register instead!
                    const regData = await apiFetch('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });

                    displayMsg('Registration successful! Logging in...', false);
                    
                    // Immediately login after successful registration
                    const loginRetry = await apiFetch('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password, role: currentRole })
                    });
                    
                    handleAuthSuccess(loginRetry);

                } else {
                    // This means they are registered, but used the wrong password.
                    displayMsg(loginError.message);
                }
            }

        } catch (error) {
            displayMsg(error.message || 'An error occurred.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Sign In / Register';
        }
    });

    function handleAuthSuccess(data) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            name: data.name,
            role: data.role
        }));
        // Small delay so users see it worked
        setTimeout(() => {
            window.location.href = data.role === 'student' ? '/student-dashboard.html' : '/librarian-dashboard.html';
        }, 300);
    }
});
