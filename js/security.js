/**
 * FinPlan Security & Access Logic
 * Managed by Member B
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('finplan_session');
        window.location.href = 'login.html'; 
    });

    // --- 2. PASSWORD VISIBILITY TOGGLE (Eye Icon) ---
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash'); // Switch to slashed eye
                this.style.color = '#2D6A4F'; // Turn green when visible
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye'); // Switch back to normal eye
                this.style.color = '#6c757d'; // Back to grey
            }
        });
    });

    // --- 3. PASSWORD STRENGTH METER LOGIC ---
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const saveBtn = document.getElementById('savePasswordBtn');
    
    let isStrongEnough = false;

    newPasswordInput.addEventListener('input', () => {
        const val = newPasswordInput.value;
        let score = 0;

        if (val.length >= 8) score++; 
        if (/[A-Z]/.test(val)) score++; 
        if (/[0-9]/.test(val)) score++; 
        if (/[^A-Za-z0-9]/.test(val)) score++; 

        strengthBar.className = 'progress-bar'; 
        
        if (val.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = 'Enter a new password';
            strengthText.className = 'small text-muted mt-1 mb-0';
            isStrongEnough = false;
        } else if (score <= 2) {
            strengthBar.style.width = '33%';
            strengthBar.classList.add('bg-danger');
            strengthText.textContent = 'Weak: Add numbers and special characters.';
            strengthText.className = 'small text-danger mt-1 mb-0';
            isStrongEnough = false;
        } else if (score === 3) {
            strengthBar.style.width = '66%';
            strengthBar.classList.add('bg-warning');
            strengthText.textContent = 'Moderate: Add an uppercase letter or special character.';
            strengthText.className = 'small text-warning mt-1 mb-0';
            isStrongEnough = true; 
        } else if (score >= 4) {
            strengthBar.style.width = '100%';
            strengthBar.classList.add('bg-success');
            strengthText.textContent = 'Strong: Excellent password!';
            strengthText.className = 'small text-success mt-1 mb-0';
            isStrongEnough = true;
        }

        checkMatch();
    });

    // --- 4. PASSWORD MATCH VALIDATION ---
    confirmPasswordInput.addEventListener('input', checkMatch);

    function checkMatch() {
        const val1 = newPasswordInput.value;
        const val2 = confirmPasswordInput.value;

        if (val2.length > 0) {
            if (val1 !== val2) {
                confirmPasswordInput.classList.add('is-invalid');
                saveBtn.disabled = true;
            } else {
                confirmPasswordInput.classList.remove('is-invalid');
                saveBtn.disabled = !isStrongEnough; 
            }
        } else {
            confirmPasswordInput.classList.remove('is-invalid');
            saveBtn.disabled = true;
        }
    }

    // --- 5. ACTUAL FORM SUBMISSION & DATA SAVING ---
    document.getElementById('passwordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassInput = document.getElementById('currentPassword').value;
        const newPassInput = document.getElementById('newPassword').value;

        // Fetch the logged-in user's data from localStorage
        const sessionEmail = localStorage.getItem('finplan_active_user_email');
        const userKey = `user_${sessionEmail}`;
        const userData = JSON.parse(localStorage.getItem(userKey));

        // Security Check: Verify old password
        if (userData.password !== currentPassInput) {
            alert("Error: The Current Password you entered is incorrect!");
            return; // Stop the update process
        }
        
        // Security Check Passed: Save the new password
        userData.password = newPassInput;
        localStorage.setItem(userKey, JSON.stringify(userData));

        alert('Success! Your password has been updated securely.');
        e.target.reset();
        
        // Reset the meter UI
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Enter a new password';
        strengthText.className = 'small text-muted mt-1 mb-0';
        saveBtn.disabled = true;

        // Force icons back to hidden state
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            icon.style.color = '#6c757d';
        });
    });

    // --- 6. 2FA TOGGLE DEMO ---
    document.getElementById('toggle2FA').addEventListener('change', (e) => {
        if (!e.target.checked) {
            alert('Warning: Disabling 2FA will reduce your account security.');
        } else {
            alert('2FA via Email OTP is now enabled.');
        }
    });
});