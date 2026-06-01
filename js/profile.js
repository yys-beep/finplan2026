/**
 * FinPlan Profile Management (Cloud Version)
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- AGGRESSIVE BACK-BUTTON PROTECTION ---
    window.addEventListener('pageshow', (event) => {
        // event.persisted is TRUE if the browser loaded the page from the "Back" button cache
        if (event.persisted || !localStorage.getItem('finplan_session')) {
            if (!localStorage.getItem('finplan_session')) {
                window.location.replace('login.html');
            }
        }
    });

    const sessionEmail = localStorage.getItem('finplan_active_user_email');

    // If there is no active session, redirect to login
    if (!sessionEmail) {
        window.location.href = 'login.html';
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
        
        // 1. Clear the security tokens
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        
        // 2. Use REPLACE instead of HREF
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
        } else {
            console.error("Profile load error:", result.error);
        }
    } catch (err) {
        console.error("Failed to connect to database.", err);
    }

    // --- 3. PROFILE PIC UPLOAD (Base64) ---
    const uploadInput = document.getElementById('uploadPic');
    const profileImg = document.getElementById('profilePic');

    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function() {
                profileImg.src = reader.result;
                cloudUserData.profilePic = reader.result; // Temporarily hold in variable
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 4. SAVE PROFILE TO MONGODB ---
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
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
                // Keep a local copy updated so the Dashboard charts stay fast
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

    // --- 5. TERMINATION ---
    document.getElementById('deleteAccount').addEventListener('click', () => {
        if (confirm("Delete your account permanently?")) {
            localStorage.removeItem(`user_${sessionEmail}`);
            localStorage.removeItem('finplan_session');
            localStorage.removeItem('finplan_active_user_email');
            window.location.href = 'login.html';
        }
    });
});