/**
 * FinPlan Profile Management (Cloud Version)
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- AGGRESSIVE BACK-BUTTON PROTECTION ---
    window.addEventListener('pageshow', (event) => {
        if (event.persisted || !localStorage.getItem('finplan_session')) {
            if (!localStorage.getItem('finplan_session')) {
                window.location.replace('login.html');
            }
        }
    });

    const sessionEmail = localStorage.getItem('finplan_active_user_email');

    // If there is no active session, redirect to login
    if (!sessionEmail) {
        window.location.replace('login.html');
        return;
    }

    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { 
        if(themeToggle) themeToggle.checked = true; 
    }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        window.location.replace('login.html'); 
    });

    // --- 2. FETCH DATA FROM MONGODB ---
    let cloudUserData = {};
    try {
        const response = await fetch('/.netlify/functions/auth-api', {
            method: 'POST',
            body: JSON.stringify({ action: 'get-profile', email: sessionEmail })
        });
        const result = await response.json();
        
        if (response.ok) {
            cloudUserData = result.user;
            
            // Populate the Form with Cloud Data
            document.getElementById('userName').value = cloudUserData.name || "";
            document.getElementById('userDOB').value = cloudUserData.dob || "";
            document.getElementById('userBio').value = cloudUserData.bio || "";
            document.getElementById('displayName').textContent = cloudUserData.name || "Member";
            document.getElementById('displayBio').textContent = cloudUserData.bio || "Your financial journey starts here.";
            document.getElementById('userIncome').value = cloudUserData.income || 0;
            document.getElementById('userEmployment').value = cloudUserData.employment || "Employed";
            document.getElementById('userGoal').value = cloudUserData.goal || "";
            document.getElementById('userRisk').value = cloudUserData.risk || "Medium";

            if (cloudUserData.profilePic) {
                document.getElementById('profilePic').src = cloudUserData.profilePic;
            }
        }
    } catch (err) {
        console.error("Failed to connect to database.", err);
    }

    // --- 3. PROFILE PIC UPLOAD (Base64) ---
    const uploadInput = document.getElementById('uploadPic');
    const profileImg = document.getElementById('profilePic');

    if(uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function() {
                    profileImg.src = reader.result;
                    cloudUserData.profilePic = reader.result; 
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 4. SAVE PROFILE TO MONGODB ---
    const profileForm = document.getElementById('profileForm');
    if(profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                action: 'update-profile',
                email: sessionEmail,
                name: document.getElementById('userName').value,
                dob: document.getElementById('userDOB').value,
                bio: document.getElementById('userBio').value,
                income: document.getElementById('userIncome').value,
                employment: document.getElementById('userEmployment').value,
                goal: document.getElementById('userGoal').value,
                risk: document.getElementById('userRisk').value,
                profilePic: cloudUserData.profilePic 
            };

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    body: JSON.stringify(updatedData)
                });
                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem(`user_${sessionEmail}`, JSON.stringify(result.user));
                    document.getElementById('displayName').textContent = result.user.name;
                    document.getElementById('displayBio').textContent = result.user.bio;
                    alert('Profile saved securely to the cloud!');
                    location.reload();
                } else {
                    alert(`Error saving profile: ${result.error}`);
                }
            } catch (err) {
                alert('Network error. Could not save to database.');
            }
        });
    }

    // ==========================================================
    // 5. TERMINATION (SECURE DELETION VIA BOOTSTRAP MODAL)
    // ==========================================================
    const deleteAccountBtn = document.getElementById('deleteAccount');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const passwordInput = document.getElementById('modalPasswordInput');
    
    // --- NEW: TOGGLE PASSWORD VISIBILITY ---
    const toggleDeletePassword = document.getElementById('toggleDeletePassword');
    if (toggleDeletePassword && passwordInput) {
        toggleDeletePassword.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                icon.style.color = '#2D6A4F'; // Highlights green when visible
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.style.color = ''; // Returns to gray
            }
        });
    }
    
    // Part A: Open the Modal when the danger zone button is clicked
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            if (typeof bootstrap !== 'undefined') {
                const myModal = new bootstrap.Modal(document.getElementById('deletePasswordModal'));
                myModal.show();
            } else {
                alert("Error: Bootstrap JS is not loaded.");
            }
        });
    }

    // Part B: Handle the backend request when the Modal "Delete Account" button is clicked
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const password = passwordInput.value;
            
            if (!password) {
                return alert("Password is required to authorize deletion.");
            }

            // Show loading state on the button
            const originalText = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';
            confirmDeleteBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/auth-api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'delete-account', 
                        email: sessionEmail,
                        password: password // Sends hidden modal password to backend
                    })
                });
                
                const result = await response.json();

                if (response.ok) {
                    alert("Your account and all associated data have been permanently deleted.");
                    
                    // Secure Session Purge
                    localStorage.removeItem('finplan_session');
                    localStorage.removeItem('finplan_active_user_email');
                    localStorage.removeItem(`user_${sessionEmail}`);
                    
                    window.location.replace('login.html'); 
                } else {
                    alert(`Security Error: ${result.error}`);
                }
            } catch (err) {
                alert("Network error. Could not connect to the server.");
            } finally {
                // Reset button state if it failed
                confirmDeleteBtn.innerHTML = originalText;
                confirmDeleteBtn.disabled = false;
                passwordInput.value = ""; // Clear the password field for safety
            }
        });
    }
});

// unit testing UT-01, UT-02
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validateEmail, validatePassword };
}