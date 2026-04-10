/**
 * FinPlan Complete Authentication System
 * Handles Registration, Login, OTP, and Password Reset
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. DEVELOPER CHEAT SHEET (Console Log)
    // ==========================================
    console.log("%c=== FINPLAN DEVELOPER DATA ===", "color: #2D6A4F; font-weight: bold; font-size: 14px;");
    const registeredUsers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('user_')) {
            const userData = JSON.parse(localStorage.getItem(key));
            userData.email = key.replace('user_', ''); 
            registeredUsers.push(userData);
        }
    }
    
    if (registeredUsers.length > 0) {
        console.log("Registered Test Accounts:");
        console.table(registeredUsers.map(user => ({ 
            Email: user.email, 
            Password: user.password, 
            Name: user.name 
        })));
    } else {
        console.log("No users registered yet in this browser.");
    }
    console.log("%c==============================", "color: #2D6A4F; font-weight: bold;");


    // ==========================================
    // 2. PASSWORD VISIBILITY TOGGLE (Eye Icon)
    // ==========================================
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


    // ==========================================
    // 3. UI FORM TOGGLES
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const otpForm = document.getElementById('otpForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const authSubtitle = document.getElementById('authSubtitle');

    // Toggle helper to reset UI
    const showForm = (toShow) => {
        [loginForm, registerForm, otpForm, forgotPasswordForm, resetPasswordForm].forEach(f => f?.classList.add('d-none'));
        toShow.classList.remove('d-none');
    };

    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(registerForm);
        authSubtitle.textContent = "Create your account";
    });

    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm);
        authSubtitle.textContent = "Your secure financial gateway";
    });

    document.getElementById('showForgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(forgotPasswordForm);
        authSubtitle.textContent = "Password Recovery";
    });

    document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm);
        authSubtitle.textContent = "Your secure financial gateway";
    });


    // ==========================================
    // 4. REGISTRATION STRENGTH METER & VALIDATION
    // ==========================================
    const regMatchText = document.getElementById('regMatchText');
    const regPasswordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const regStrengthBar = document.getElementById('strengthBar');
    const regStrengthText = document.getElementById('regStrengthText'); // New label selector
    const regSubmitBtn = registerForm?.querySelector('button[type="submit"]');
    
    let regIsStrongEnough = false;

    if (regPasswordInput && regStrengthBar) {
        regPasswordInput.addEventListener('input', () => {
            const val = regPasswordInput.value;
            let score = 0;

            // 1. Calculate Score
            if (val.length >= 8) score++; 
            if (/[A-Z]/.test(val)) score++; 
            if (/[0-9]/.test(val)) score++; 
            if (/[^A-Za-z0-9]/.test(val)) score++; 

            // 2. Reset UI state
            regStrengthBar.className = 'progress-bar'; 
            
            if (val.length === 0) {
                regStrengthBar.style.width = '0%';
                regStrengthText.textContent = 'Enter a new password';
                regStrengthText.className = 'small text-muted mt-1 mb-0';
                regIsStrongEnough = false;
            } else if (score <= 2) {
                regStrengthBar.style.width = '33%';
                regStrengthBar.classList.add('bg-danger');
                regStrengthText.textContent = 'Weak: Add numbers and special characters.';
                regStrengthText.className = 'small text-danger mt-1 mb-0';
                regIsStrongEnough = false;
            } else if (score === 3) {
                regStrengthBar.style.width = '66%';
                regStrengthBar.classList.add('bg-warning');
                regStrengthText.textContent = 'Moderate: Add an uppercase letter.';
                regStrengthText.className = 'small text-warning mt-1 mb-0';
                regIsStrongEnough = true; 
            } else {
                regStrengthBar.style.width = '100%';
                regStrengthBar.classList.add('bg-success');
                regStrengthText.textContent = 'Strong: Excellent password!';
                regStrengthText.className = 'small text-success mt-1 mb-0';
                regIsStrongEnough = true;
            }
            validateRegForm();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateRegForm);
    }

    function validateRegForm() {
        const p1 = regPasswordInput.value;
        const p2 = confirmPasswordInput.value;
        const match = p1 === p2 && p2.length > 0;
        
        if (p2.length === 0) {
            // Empty confirm field
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger', 'border-success');
            if (regMatchText) {
                regMatchText.textContent = 'Passwords must match';
                regMatchText.className = 'small text-muted mt-1 mb-0';
            }
        } else if (!match) {
            // Typing, but doesn't match yet
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-success');
            confirmPasswordInput.classList.add('border-danger'); 
            if (regMatchText) {
                regMatchText.textContent = 'Passwords do not match';
                regMatchText.className = 'small text-danger mt-1 mb-0';
            }
        } else {
            // Perfect match
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger');
            confirmPasswordInput.classList.add('border-success'); 
            if (regMatchText) {
                regMatchText.textContent = 'Passwords match!';
                regMatchText.className = 'small text-success mt-1 mb-0';
            }
        }

        // REMOVED THE BUTTON DISABLED LOGIC FROM HERE!
    }


    // ==========================================
    // 5. REGISTRATION SUBMISSION
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('regEmail').value.trim();
            const password = regPasswordInput.value;

            const userData = {
                name: document.getElementById('regName').value,
                dob: document.getElementById('regDOB').value,
                password: password,
                income: document.getElementById('regIncome').value,
                employment: document.getElementById('regEmployment').value,
                goal: document.getElementById('regGoals').value,
                risk: document.getElementById('regRisk').value,
            };

            localStorage.setItem(`user_${email}`, JSON.stringify(userData));
            
            alert("Registration successful! Your account is secured. Please log in.");
            
            registerForm.reset();
            regStrengthBar.style.width = '0%';
            showForm(loginForm);
            authSubtitle.textContent = "Your secure financial gateway";
        });
    }


    // ==========================================
    // 6. LOGIN & OTP FLOW
    // ==========================================
    let currentLoginEmail = "";

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const userData = JSON.parse(localStorage.getItem(`user_${email}`));

            if (userData && userData.password === password) {
                currentLoginEmail = email; 
                showForm(otpForm);
                authSubtitle.textContent = "Two-Factor Authentication";
            } else {
                alert("Invalid credentials.");
                document.getElementById('loginPassword').value = ''; 
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('otpInput').value === "123456") {
                localStorage.setItem('finplan_session', Date.now());
                localStorage.setItem('finplan_active_user_email', currentLoginEmail);
                window.location.href = 'dashboard.html';
            } else {
                alert("Invalid OTP code!");
            }
        });
    }


    // ==========================================
    // 7. FORGOT PASSWORD LOGIC
    // ==========================================
    let emailToReset = "";

    forgotPasswordForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value.trim();
        if (!localStorage.getItem(`user_${email}`)) {
            alert("Account not found.");
            return;
        }
        emailToReset = email;
        showForm(resetPasswordForm);
    });

    resetPasswordForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('resetCode').value;
        const newPassword = document.getElementById('newResetPassword').value;

        if (code === "888888" && newPassword.length >= 8) {
            const userData = JSON.parse(localStorage.getItem(`user_${emailToReset}`));
            userData.password = newPassword; 
            localStorage.setItem(`user_${emailToReset}`, JSON.stringify(userData)); 

            alert("Password updated! Log in now.");
            showForm(loginForm);
        } else {
            alert("Verification failed or password too short (min 8 chars).");
        }
    });
});