/**
 * FinPlan Security & Access Logic
 */

// unit testing UT-03, UT-04
// --- Logic Section (Safe for Node.js) ---
let bcrypt;
if (typeof require !== 'undefined') {
    bcrypt = require('bcrypt');
}

const hashPassword = async (password) => {
    if (!bcrypt) return password; // Fallback if somehow called outside Node
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash; 
};

const generateToken = (email) => {
    return "mocked.jwt.token.for." + email; 
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
    
    // --- AGGRESSIVE BACK-BUTTON PROTECTION ---
    window.addEventListener('pageshow', (event) => {
        // event.persisted is TRUE if the browser loaded the page from the "Back" button cache
        if (event.persisted || !localStorage.getItem('finplan_session')) {
            if (!localStorage.getItem('finplan_session')) {
                window.location.replace('login.html');
            }
        }
    });
    
    // --- 0. GLOBAL SESSION DATA ---
    const sessionEmail = localStorage.getItem('finplan_active_user_email');
    if (!sessionEmail) {
        window.location.href = 'login.html';
        return;
    }
    const userKey = `user_${sessionEmail}`;
    const userData = JSON.parse(localStorage.getItem(userKey)) || {};

    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Clear the security tokens
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        
        // 2. Use REPLACE instead of HREF
        window.location.replace('login.html'); 
    });

    // --- INITIALIZE 2FA UI STATE ---
    const toggle2FA = document.getElementById('toggle2FA');
    if (toggle2FA) {
        // Set the toggle switch to match what is saved in MongoDB
        toggle2FA.checked = userData.twoFactorEnabled !== false; 
    }

    // --- 2. PASSWORD VISIBILITY TOGGLE (Eye Icon) ---
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
                this.style.color = '#2D6A4F'; 
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye'); 
                this.style.color = '#6c757d'; 
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

    // --- 5. SECURE FORM SUBMISSION (MongoDB) ---
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassInput = document.getElementById('currentPassword').value;
        const newPassInput = document.getElementById('newPassword').value;

        // Set loading state on the button
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Securing...';
        saveBtn.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/auth-api', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'change-password',
                    email: sessionEmail,
                    currentPassword: currentPassInput,
                    newPassword: newPassInput
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Success! Your password has been updated securely in the cloud.');
                e.target.reset();
                
                // Reset the meter UI
                strengthBar.style.width = '0%';
                strengthText.textContent = 'Enter a new password';
                strengthText.className = 'small text-muted mt-1 mb-0';
                
                // Force icons back to hidden state
                document.querySelectorAll('.toggle-password').forEach(icon => {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                    icon.style.color = '#6c757d';
                });
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            alert('Network error. Could not connect to the security server.');
        } finally {
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = true; 
        }
    });

    // --- 6. REAL 2FA TOGGLE (MongoDB) ---
    toggle2FA?.addEventListener('change', async (e) => {
        const isEnabled = e.target.checked;
        
        try {
            const response = await fetch('/.netlify/functions/auth-api', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update-2fa',
                    email: sessionEmail,
                    isEnabled: isEnabled
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Update local storage so the toggle stays correct on refresh
                localStorage.setItem(`user_${sessionEmail}`, JSON.stringify(result.user));
                
                if (isEnabled) {
                    alert('2FA via Email OTP is now enabled and secured.');
                } else {
                    alert('Warning: 2FA is now disabled. You will no longer receive email codes.');
                }
            }
        } catch (err) {
            alert('Network error. Could not update 2FA settings.');
            // Revert the toggle visually if it failed
            e.target.checked = !isEnabled; 
        }
    });
});
}

// unit testing UT-03, UT-04
// Safely export only if running in Node.js (Testing environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hashPassword, generateToken };
}