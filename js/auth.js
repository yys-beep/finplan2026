/**
 * FinPlan Complete Authentication System
 * Handles Registration, Login, OTP, and Password Reset
 */

// --- Logic Section (Safe for Node.js) ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (p) => p.length >= 8;

// --- Event Listener Section (Only runs in Browser) ---
// Wrap this in a check so it doesn't run during testing
if (typeof document !== 'undefined') {
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
        console.log("Registered Test Accounts (Local Storage Only):");
        console.table(registeredUsers.map(user => ({ 
            Email: user.email, 
            Password: user.password, 
            Name: user.name 
        })));
    } else {
        console.log("No users registered locally in this browser.");
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

    document.getElementById('backToLoginFromReset')?.addEventListener('click', (e) => {
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
    const regStrengthText = document.getElementById('regStrengthText'); 
    
    let regIsStrongEnough = false;

    if (regPasswordInput && regStrengthBar) {
        regPasswordInput.addEventListener('input', () => {
            const val = regPasswordInput.value;
            let score = 0;

            if (val.length >= 8) score++; 
            if (/[A-Z]/.test(val)) score++; 
            if (/[0-9]/.test(val)) score++; 
            if (/[^A-Za-z0-9]/.test(val)) score++; 

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
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger', 'border-success');
            if (regMatchText) {
                regMatchText.textContent = 'Passwords must match';
                regMatchText.className = 'small text-muted mt-1 mb-0';
            }
        } else if (!match) {
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-success');
            confirmPasswordInput.classList.add('border-danger'); 
            if (regMatchText) {
                regMatchText.textContent = 'Passwords do not match';
                regMatchText.className = 'small text-danger mt-1 mb-0';
            }
        } else {
            confirmPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger');
            confirmPasswordInput.classList.add('border-success'); 
            if (regMatchText) {
                regMatchText.textContent = 'Passwords match!';
                regMatchText.className = 'small text-success mt-1 mb-0';
            }
        }
    }


    // ==========================================
    // 5. REGISTRATION SUBMISSION (MongoDB)
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('regEmail').value.trim();
            const password = regPasswordInput.value;

            const userData = {
                action: 'register',
                email: email,
                password: password,
                name: document.getElementById('regName').value,
                dob: document.getElementById('regDOB').value,
                income: document.getElementById('regIncome').value,
                employment: document.getElementById('regEmployment').value,
                goal: document.getElementById('regGoals').value,
                risk: document.getElementById('regRisk').value,
            };

            // Set loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Securing...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                
                // Get the raw text first to prevent JSON parse errors if the DB crashes
                const rawText = await response.text(); 
                
                try {
                    const result = JSON.parse(rawText);

                    if (response.ok) {
                        alert("Registration successful! Your account is secured. Please log in.");
                        registerForm.reset();
                        regStrengthBar.style.width = '0%';
                        showForm(loginForm);
                        authSubtitle.textContent = "Your secure financial gateway";
                    } else {
                        alert(`Registration Error: ${result.error}`);
                    }
                } catch (parseError) {
                    console.error("Server sent a non-JSON response:", rawText);
                    alert("Database connection failed. Please check your terminal for Mongoose errors.");
                }
            } catch (err) {
                console.error("Registration request failed", err);
                alert("Network error. Could not connect to the server.");
            } finally {
                // Restore button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }


    /// ==========================================
    // 6. LOGIN & REAL EMAIL OTP FLOW (MongoDB)
    // ==========================================
    let currentLoginEmail = "";

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'login', email: email, password: password })
                });
                
                const rawText = await response.text();
                
                try {
                    const result = JSON.parse(rawText);

                    if (response.ok) {
                        currentLoginEmail = email; 
                        
                        // THE FIX: Check for 2FA immediately after Login is clicked
                        if (result.requireOtp) {
                            // 2FA is ON: Show the OTP form
                            showForm(otpForm);
                            authSubtitle.textContent = "Check your email for the 6-digit code";
                        } else {
                            // 2FA is OFF: Bypass OTP and log in instantly
                            localStorage.setItem('finplan_session', Date.now());
                            localStorage.setItem('finplan_active_user_email', currentLoginEmail);
                            localStorage.setItem(`user_${currentLoginEmail}`, JSON.stringify(result.user));
                            window.location.href = 'dashboard.html';
                        }
                    } else {
                        alert(`Login Failed: ${result.error}`);
                        document.getElementById('loginPassword').value = ''; 
                    }
                } catch (parseError) {
                    alert("Database connection failed. Please check your terminal.");
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpCode = document.getElementById('otpInput').value.trim();

            const submitBtn = otpForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
            submitBtn.disabled = true;

            try {
                // Send the OTP to the backend for actual verification
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'verify-otp', email: currentLoginEmail, otp: otpCode })
                });

                const rawText = await response.text();

                try {
                    const result = JSON.parse(rawText);

                    if (response.ok) {
                        // OTP Verified! Log them in.
                        localStorage.setItem('finplan_session', Date.now());
                        localStorage.setItem('finplan_active_user_email', currentLoginEmail);
                        localStorage.setItem(`user_${currentLoginEmail}`, JSON.stringify(result.user));
                        window.location.href = 'dashboard.html';
                    } else {
                        alert(`Verification Failed: ${result.error}`);
                    }
                } catch (parseError) {
                    alert("Database connection failed. Please check your terminal.");
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }


    // ==========================================
    // 7. REAL FORGOT PASSWORD LOGIC (MongoDB)
    // ==========================================
    let emailToReset = "";
    
    // --- STRENGTH METER & VALIDATION LOGIC ---
    const newResetPasswordInput = document.getElementById('newResetPassword');
    const confirmResetPasswordInput = document.getElementById('confirmResetPassword');
    const resetStrengthBar = document.getElementById('resetStrengthBar');
    const resetStrengthText = document.getElementById('resetStrengthText');
    const resetMatchText = document.getElementById('resetMatchText');
    const resetSubmitBtn = resetPasswordForm?.querySelector('button[type="submit"]');
    let resetIsStrongEnough = false;

    if (newResetPasswordInput && resetStrengthBar) {
        newResetPasswordInput.addEventListener('input', () => {
            const val = newResetPasswordInput.value;
            let score = 0;

            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            resetStrengthBar.className = 'progress-bar';

            if (val.length === 0) {
                resetStrengthBar.style.width = '0%';
                resetStrengthText.textContent = 'Enter a new password';
                resetStrengthText.className = 'small text-muted mt-1 mb-0';
                resetIsStrongEnough = false;
            } else if (score <= 2) {
                resetStrengthBar.style.width = '33%';
                resetStrengthBar.classList.add('bg-danger');
                resetStrengthText.textContent = 'Weak: Add numbers and special characters.';
                resetStrengthText.className = 'small text-danger mt-1 mb-0';
                resetIsStrongEnough = false;
            } else if (score === 3) {
                resetStrengthBar.style.width = '66%';
                resetStrengthBar.classList.add('bg-warning');
                resetStrengthText.textContent = 'Moderate: Add an uppercase letter.';
                resetStrengthText.className = 'small text-warning mt-1 mb-0';
                resetIsStrongEnough = true;
            } else {
                resetStrengthBar.style.width = '100%';
                resetStrengthBar.classList.add('bg-success');
                resetStrengthText.textContent = 'Strong: Excellent password!';
                resetStrengthText.className = 'small text-success mt-1 mb-0';
                resetIsStrongEnough = true;
            }
            validateResetForm();
        });
    }

    if (confirmResetPasswordInput) {
        confirmResetPasswordInput.addEventListener('input', validateResetForm);
    }

    function validateResetForm() {
        const p1 = newResetPasswordInput.value;
        const p2 = confirmResetPasswordInput.value;
        const match = p1 === p2 && p2.length > 0;

        if (p2.length === 0) {
            confirmResetPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger', 'border-success');
            if (resetMatchText) {
                resetMatchText.textContent = 'Passwords must match';
                resetMatchText.className = 'small text-muted mt-1 mb-0';
            }
            if (resetSubmitBtn) resetSubmitBtn.disabled = true;
        } else if (!match) {
            confirmResetPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-success');
            confirmResetPasswordInput.classList.add('border-danger');
            if (resetMatchText) {
                resetMatchText.textContent = 'Passwords do not match!';
                resetMatchText.className = 'small text-danger mt-1 mb-0';
            }
            if (resetSubmitBtn) resetSubmitBtn.disabled = true;
        } else {
            confirmResetPasswordInput.classList.remove('is-invalid', 'is-valid', 'border-danger');
            confirmResetPasswordInput.classList.add('border-success');
            if (resetMatchText) {
                resetMatchText.textContent = 'Passwords match!';
                resetMatchText.className = 'small text-success mt-1 mb-0';
            }
            // Only enable button if passwords match AND the strength is sufficient
            if (resetSubmitBtn) resetSubmitBtn.disabled = !resetIsStrongEnough;
        }
    }

    // --- FORM SUBMISSION LOGIC ---
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();
            
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'forgot-password', email: email })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    emailToReset = email;
                    showForm(resetPasswordForm);
                    authSubtitle.textContent = "Check your email for the reset code";
                    
                    // Start with the update button disabled
                    if (resetSubmitBtn) resetSubmitBtn.disabled = true;
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('resetCode').value.trim();
            const newPassword = document.getElementById('newResetPassword').value;

            const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        action: 'reset-password', 
                        email: emailToReset, 
                        otp: code, 
                        newPassword: newPassword 
                    })
                });
                
                const result = await response.json();

                if (response.ok) {
                    alert("Success! Your password has been securely reset. You can now log in.");
                    resetPasswordForm.reset();
                    // Reset UI
                    if(resetStrengthBar) resetStrengthBar.style.width = '0%';
                    showForm(loginForm);
                    authSubtitle.textContent = "Your secure financial gateway";
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 8. SECURITY EXPANSION: DELETE ACCOUNT (BULLETPROOF FIX)
    // ==========================================
    document.addEventListener('click', async (e) => {
        // .closest() ensures the click works even if they click the text inside the button
        const deleteBtn = e.target.closest('#deleteAccount');
        
        if (deleteBtn) {
            e.preventDefault();
            console.log("Delete button successfully clicked!");
            
            // Step 1: Initial Warning Confirmation
            const confirmDelete = confirm("WARNING: Are you sure you want to permanently delete your account? All your financial data will be wiped. This cannot be undone.");
            if (!confirmDelete) return;

            // Step 2: Request Password Verification
            const confirmationPassword = prompt("SECURITY CHECK: Please re-enter your account password to authorize deletion:");
            if (confirmationPassword === null) return; // User clicked cancel
            
            if (confirmationPassword.trim() === "") {
                alert("Password validation required. Deletion aborted.");
                return;
            }

            const activeEmail = localStorage.getItem('finplan_active_user_email');
            if (!activeEmail) {
                alert("Session expired. Please log in again.");
                window.location.href = 'login.html';
                return;
            }

            const originalText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verifying...';
            deleteBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        action: 'delete-account', 
                        email: activeEmail,
                        password: confirmationPassword // Forward input to backend bcrypt validator
                    })
                });
                
                const result = await response.json();

                if (response.ok) {
                    alert("Your account and all associated data have been permanently deleted.");
                    
                    // Secure Session Purge
                    localStorage.removeItem('finplan_session');
                    localStorage.removeItem('finplan_active_user_email');
                    localStorage.removeItem(`user_${activeEmail}`);
                    
                    window.location.replace('login.html'); 
                } else {
                    alert(`Security Error: ${result.error}`);
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                deleteBtn.innerHTML = originalText;
                deleteBtn.disabled = false;
            }
        }
    });

});

}

// unit testing UT-01, UT-02
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validateEmail, validatePassword };
}