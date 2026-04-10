/**
 * FinPlan Profile Management
 */

document.addEventListener('DOMContentLoaded', () => {
    const sessionEmail = localStorage.getItem('finplan_active_user_email');
    const userKey = `user_${sessionEmail}`;
    const userData = JSON.parse(localStorage.getItem(userKey));

    if (!sessionEmail || !userData) {
        window.location.href = 'login.html';
        return;
    }

    // --- NEW: Theme Toggle Logic ---
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

    // --- NEW: Logout Logic ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('finplan_session');
                localStorage.removeItem('finplan_active_user_email');
                window.location.href = 'login.html'; 
            }
        });
    }

    // 1. LOAD DATA
    document.getElementById('userName').value = userData.name || "";
    document.getElementById('userDOB').value = userData.dob || "";
    document.getElementById('userBio').value = userData.bio || "";
    document.getElementById('displayName').textContent = userData.name || "Member";
    document.getElementById('displayBio').textContent = userData.bio || "Your financial journey starts here.";
    document.getElementById('userIncome').value = userData.income || 0;
    document.getElementById('userEmployment').value = userData.employment || "Employed";
    document.getElementById('userGoal').value = userData.goal || "";
    document.getElementById('userRisk').value = userData.risk || "Medium";

    if (userData.profilePic) {
        document.getElementById('profilePic').src = userData.profilePic;
    }

    // 2. FIXED PROFILE PIC UPLOAD
    const uploadInput = document.getElementById('uploadPic');
    const profileImg = document.getElementById('profilePic');

    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function() {
                const result = reader.result;
                // Update UI immediately
                profileImg.src = result;
                // Save to local object
                userData.profilePic = result;
                // Critical: Save to localStorage so it persists
                localStorage.setItem(userKey, JSON.stringify(userData));
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. SAVE PROFILE
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        userData.name = document.getElementById('userName').value;
        userData.dob = document.getElementById('userDOB').value;
        userData.bio = document.getElementById('userBio').value;
        userData.income = document.getElementById('userIncome').value;
        userData.employment = document.getElementById('userEmployment').value;
        userData.goal = document.getElementById('userGoal').value;
        userData.risk = document.getElementById('userRisk').value;

        localStorage.setItem(userKey, JSON.stringify(userData));
        
        // Update display labels before reload
        document.getElementById('displayName').textContent = userData.name;
        document.getElementById('displayBio').textContent = userData.bio;
        
        alert('Profile saved securely!');
        location.reload();
    });

    // 4. TERMINATION
    document.getElementById('deleteAccount').addEventListener('click', () => {
        if (confirm("Delete your account permanently?")) {
            localStorage.removeItem(userKey);
            localStorage.removeItem('finplan_session');
            localStorage.removeItem('finplan_active_user_email');
            window.location.href = 'login.html';
        }
    });
});