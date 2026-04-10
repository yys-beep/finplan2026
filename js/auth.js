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

    // Show Register
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        authSubtitle.textContent = "Create your account";
    });

    // Back to Login from Register
    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
        authSubtitle.textContent = "Your secure financial gateway";
    });

    // Show Forgot Password Form
    document.getElementById('showForgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('d-none');
        forgotPasswordForm.classList.remove('d-none');
        authSubtitle.textContent = "Password Recovery";
    });

    // Back to Login from Forgot Password
    document.getElementById('backToLoginFromForgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
        authSubtitle.textContent = "Your secure financial gateway";
    });


    // ==========================================
    // 4. REGISTRATION LOGIC
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (password !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            const userData = {
                name: document.getElementById('regName').value,
                dob: document.getElementById('regDOB').value,
                password: password,
                income: document.getElementById('regIncome').value,
                employment: document.getElementById('regEmployment').value,
                goal: document.getElementById('regGoals').value,
                risk: document.getElementById('regRisk').value,
            };

            // Save to LocalStorage
            localStorage.setItem(`user_${email}`, JSON.stringify(userData));
            
            alert("Registration successful! You can now log in.");
            
            // Switch back to login
            registerForm.reset();
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            authSubtitle.textContent = "Your secure financial gateway";
            
            // Helpful dev alert
            console.log(`New user registered: ${email}`);
        });
    }


    // ==========================================
    // 5. BULLETPROOF LOGIN & OTP LOGIC
    // ==========================================
    let currentLoginEmail = "";

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const userKey = `user_${email}`;
            
            const userData = JSON.parse(localStorage.getItem(userKey));

            if (userData && userData.password === password) {
                // Success -> Show OTP
                currentLoginEmail = email; 
                loginForm.classList.add('d-none');
                otpForm.classList.remove('d-none');
                authSubtitle.textContent = "Two-Factor Authentication";
            } else {
                // Fail -> Clear password field only
                alert("Invalid email or password. Please try again.");
                document.getElementById('loginPassword').value = ''; 
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const otp = document.getElementById('otpInput').value;

            if (otp === "123456") {
                // Grant Access & Redirect
                localStorage.setItem('finplan_session', Date.now());
                localStorage.setItem('finplan_active_user_email', currentLoginEmail);
                window.location.href = 'dashboard.html';
            } else {
                alert("Invalid OTP code!");
            }
        });
    }


    // ==========================================
    // 6. FORGOT PASSWORD / RESET LOGIC
    // ==========================================
    let emailToReset = "";

    // Step 1: Request Code
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();
            const userKey = `user_${email}`;
            
            if (!localStorage.getItem(userKey)) {
                alert("Error: No account found with that email address.");
                return;
            }

            emailToReset = email;
            forgotPasswordForm.classList.add('d-none');
            resetPasswordForm.classList.remove('d-none');
        });
    }

    // Step 2: Verify Code and Save New Password
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('resetCode').value;
            const newPassword = document.getElementById('newResetPassword').value;

            if (code !== "888888") {
                alert("Invalid verification code! Please try 888888.");
                return;
            }

            if (newPassword.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            // Update user password in LocalStorage
            const userKey = `user_${emailToReset}`;
            const userData = JSON.parse(localStorage.getItem(userKey));
            
            userData.password = newPassword; 
            localStorage.setItem(userKey, JSON.stringify(userData)); 

            alert("Success! Your password has been updated. Please sign in with your new password.");
            
            resetPasswordForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            authSubtitle.textContent = "Your secure financial gateway";
            
            forgotPasswordForm.reset();
            resetPasswordForm.reset();
        });
    }

});