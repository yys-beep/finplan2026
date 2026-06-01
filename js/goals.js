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

    const email = localStorage.getItem('finplan_active_user_email');
    const profileKey = `user_${email}`;
    
    // Redirect if not logged in
    if (!email) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(localStorage.getItem(profileKey)) || {};
    let goals = []; // Will be populated from MongoDB
    let editingIndex = -1; 

    const goalForm = document.getElementById('goalForm');
    const goalList = document.getElementById('goalList');

    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Clear the security tokens
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        
        // 2. Use REPLACE instead of HREF
        window.location.replace('login.html'); 
    });

    // --- FETCH GOALS FROM CLOUD ---
    async function loadGoals() {
        goalList.innerHTML = '<div class="text-center w-100"><div class="spinner-border text-primary"></div></div>';
        try {
            const res = await fetch(`/.netlify/functions/goals-api?email=${email}`);
            if (res.ok) {
                goals = await res.json();
                
                // Save a quick copy to localStorage so the Dashboard charts can read them instantly
                localStorage.setItem(`goals_${email}`, JSON.stringify(goals));
                
                renderGoals();
            }
        } catch (err) {
            console.error("Failed to load goals", err);
            goalList.innerHTML = '<div class="text-danger">Failed to load goals from server.</div>';
        }
    }

    // --- REAL AI Strategy Logic ---
    window.getAIAdvice = async function(index) {
        const goal = goals[index];
        const adviceBox = document.getElementById(`aiAdvice-${index}`);
        
        // 1. Show a loading state so the user knows the AI is thinking
        adviceBox.innerHTML = `<div class="small text-muted"><span class="spinner-border spinner-border-sm me-2" role="status"></span>AI is analyzing your goal...</div>`;
        adviceBox.classList.remove('d-none');

        // 2. Package the data to send to the AI
        const requestData = {
            goalName: goal.name,
            targetAmount: goal.amount,
            savedAmount: goal.saved,
            targetDate: goal.date,
            monthlyIncome: parseFloat(userData.income) || 0,
            riskTolerance: userData.risk || 'Medium'
        };

        try {
            // 3. Ask the Netlify backend to talk to Gemini
            const response = await fetch('/.netlify/functions/ai-advisor', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                // 4. Display the real AI advice!
                adviceBox.innerHTML = `<div class="small" style="color: var(--text-color);">
                    <i class="fa-solid fa-wand-magic-sparkles text-success me-1"></i> 
                    <b>Smart Advice:</b> ${result.advice}
                </div>`;
            } else {
                adviceBox.innerHTML = `<div class="small text-danger">AI analysis temporarily unavailable.</div>`;
            }
        } catch (error) {
            adviceBox.innerHTML = `<div class="small text-danger">Network error connecting to AI.</div>`;
        }
    };

    // --- Render Goals ---
    function renderGoals() {
        goalList.innerHTML = '';
        
        if(goals.length === 0) {
            goalList.innerHTML = '<div class="text-muted w-100 text-center">No goals created yet. Start planning above!</div>';
            return;
        }

        goals.forEach((goal, index) => {
            const progress = Math.min((goal.saved / goal.amount) * 100, 100);
            
            if (editingIndex === index) {
                goalList.innerHTML += `
                <div class="col-12 col-lg-6">
                    <div class="card shadow border-primary h-100">
                        <div class="card-body p-4">
                            <h6 class="fw-bold mb-3 text-primary">Editing Goal</h6>
                            <input type="text" id="editName-${index}" class="form-control form-control-sm mb-2" value="${goal.name}">
                            <input type="number" id="editAmount-${index}" class="form-control form-control-sm mb-2" value="${goal.amount}">
                            <input type="date" id="editDate-${index}" class="form-control form-control-sm mb-3" value="${goal.date}">
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm w-100" onclick="saveEdit(${index})">Save</button>
                                <button class="btn btn-secondary btn-sm w-100" onclick="cancelEdit()">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            } else {
                goalList.innerHTML += `
                <div class="col-12 col-lg-6">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-3">
                                <h5 class="fw-bold mb-0 text-primary-light">${goal.name}</h5>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-sm btn-outline-secondary border-0 py-0" onclick="startEdit(${index})"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn btn-sm btn-outline-success rounded-pill py-0" onclick="getAIAdvice(${index})">AI</button>
                                </div>
                            </div>
                            <div id="aiAdvice-${index}" class="d-none border-start border-3 border-success ps-2 mb-3 py-1"></div>
                            <p class="text-muted small mb-2">Target Date: ${new Date(goal.date).toLocaleDateString()}</p>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-forestgreen" style="width: ${progress}%"></div>
                            </div>
                            <div class="d-flex justify-content-between small text-muted mb-3">
                                <span>RM ${goal.saved.toLocaleString()}</span>
                                <span>Target: RM ${goal.amount.toLocaleString()}</span>
                            </div>
                            <div class="input-group input-group-sm">
                                <input type="number" id="add-${index}" class="form-control" placeholder="+ RM">
                                <button class="btn btn-forestgreen" onclick="updateSavings(${index})">Add</button>
                            </div>
                            <button class="btn btn-link btn-sm text-danger w-100 mt-3 text-decoration-none" onclick="removeGoal(${index})">Delete Goal</button>
                        </div>
                    </div>
                </div>`;
            }
        });
    }

    // --- CREATE GOAL ---
    goalForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = goalForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const newGoal = {
            email: email,
            name: document.getElementById('goalName').value,
            amount: document.getElementById('goalAmount').value,
            date: document.getElementById('goalDate').value,
            saved: 0
        };

        await fetch('/.netlify/functions/goals-api', {
            method: 'POST',
            body: JSON.stringify(newGoal)
        });
        
        goalForm.reset();
        submitBtn.disabled = false;
        loadGoals(); // Reload from cloud
    };

    // --- EDIT GOAL ---
    window.startEdit = (index) => { editingIndex = index; renderGoals(); };
    window.cancelEdit = () => { editingIndex = -1; renderGoals(); };

    window.saveEdit = async (index) => {
        const newName = document.getElementById(`editName-${index}`).value;
        const newAmount = parseFloat(document.getElementById(`editAmount-${index}`).value);
        const newDate = document.getElementById(`editDate-${index}`).value;

        if (newName && newAmount && newDate) {
            goals[index].name = newName;
            goals[index].amount = newAmount;
            goals[index].date = newDate;
            
            // PUT request to update in DB using the MongoDB _id
            await fetch('/.netlify/functions/goals-api', {
                method: 'PUT',
                body: JSON.stringify(goals[index])
            });

            editingIndex = -1;
            loadGoals();
        } else {
            alert("All fields are required!");
        }
    };

    // --- ADD SAVINGS ---
    window.updateSavings = async (index) => {
        const amt = parseFloat(document.getElementById(`add-${index}`).value) || 0;
        if (amt <= 0) return;

        goals[index].saved += amt;
        
        // PUT request to update in DB
        await fetch('/.netlify/functions/goals-api', {
            method: 'PUT',
            body: JSON.stringify(goals[index])
        });
        
        loadGoals();
    };

    // --- DELETE GOAL ---
    window.removeGoal = async (index) => {
        if(confirm("Are you sure you want to delete this goal permanently?")) { 
            const goalId = goals[index]._id; // Get the MongoDB ID
            
            // DELETE request
            await fetch('/.netlify/functions/goals-api', {
                method: 'DELETE',
                body: JSON.stringify({ _id: goalId })
            });
            
            loadGoals();
        }
    };

    // Initial Load
    loadGoals();
});