/**
 * FinPlan Market Insights Logic
 */


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

    // --- 2. API CONFIGURATION ---
    const newsList = document.getElementById('newsList');
    const searchInput = document.getElementById('searchNews');
    const categorySelect = document.getElementById('categoryFilter');

    // --- 3. LAZY LOADING OBSERVER ---
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; 
                img.classList.remove('lazy-image');
                observer.unobserve(img); 
            }
        });
    });

    // --- 4. FETCH AND RENDER LOGIC ---
    async function fetchNews(query) {
        newsList.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Analyzing market data...</p></div>';
        
        try {
            // Detect if running locally or on the web
            // Check if running on VS Code Live Server (Local) or Netlify
            const hostname = window.location.hostname;
            const isLocal = hostname === '127.0.0.1' || hostname === 'localhost';
            
            // If local, we can test using Netlify Dev or just bypass to a local URL if needed.
            // But for deployment, the URL must point to the Netlify Function:
            const API_URL = isLocal 
                ? `/.netlify/functions/news?q=${encodeURIComponent(query)}` 
                : `/.netlify/functions/news?q=${encodeURIComponent(query)}`;

            const res = await fetch(API_URL);
            const data = await res.json();
            
            newsList.innerHTML = '';

            if(data.status !== "ok" || !data.articles || data.articles.length === 0) {
                newsList.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="fa-solid fa-newspaper fa-2x mb-3"></i><br>No recent news found for "${query}".</div>`;
                return;
            }

            data.articles.forEach(article => {
                if (!article.title || !article.urlToImage) return;

                const cardHTML = `
                <div class="col-md-4 d-flex align-items-stretch">
                    <div class="card border-0 shadow-sm w-100 overflow-hidden market-card">
                        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==" 
                             data-src="${article.urlToImage}" 
                             class="card-img-top lazy-image" alt="News Image" style="height: 180px; object-fit: cover;">
                        
                        <div class="card-body d-flex flex-column">
                            <span class="badge bg-mintgreen text-primary mb-2 align-self-start">${article.source.name || 'News'}</span>
                            <h6 class="card-title fw-bold text-primary-light">${article.title}</h6>
                            <p class="card-text text-muted small flex-grow-1">${article.description ? article.description.substring(0, 100) + '...' : ''}</p>
                            <a href="${article.url}" target="_blank" class="btn btn-outline-forestgreen btn-sm w-100 mt-3">Read Full Article</a>
                        </div>
                    </div>
                </div>`;
                
                newsList.innerHTML += cardHTML;
            });

            // Trigger Lazy Loading
            document.querySelectorAll('.lazy-image').forEach(img => imageObserver.observe(img));

        } catch(err) {
            console.error(err);
            newsList.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i><br>Failed to connect to the news server. Please try again later.</div>';
        }
    }

    // --- 5. MONGODB PREFERENCE INTEGRATION & EVENT LISTENERS ---
    const userEmail = localStorage.getItem('finplan_active_user_email');

    // Function to save category to MongoDB when changed
    async function saveCategoryPreference(category) {
        if (!userEmail) {
            console.log("No user logged in, skipping DB save.");
            return;
        }
        try {
            await fetch('/.netlify/functions/preferences', {
                method: 'POST',
                body: JSON.stringify({ email: userEmail, newsCategory: category })
            });
            console.log("Preference saved to cloud for:", userEmail);
        } catch (err) {
            console.error("Could not save preference", err);
        }
    }
    
    // Dropdown change: IMMEDIATE fetch AND save to DB
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const newCategory = e.target.value;
            searchInput.value = ''; // Clear custom search text
            fetchNews(newCategory); // Instantly load the new category
            saveCategoryPreference(newCategory); // Save to MongoDB
        });
    }

    // Search bar typing: Waits half a second after you stop typing to avoid spamming the API
    let timeoutId;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const query = e.target.value.trim();
                fetchNews(query === '' ? categorySelect.value : query);
            }, 500);
        });
    }

    // --- 6. INITIAL LOAD (WITH MONGODB) ---
    async function initMarketInsights() {
        let startingCategory = 'finance'; // Fallback default

        if (userEmail) {
            try {
                // Ask MongoDB for the user's saved preference
                const res = await fetch(`/.netlify/functions/preferences?email=${userEmail}`);
                if (res.ok) {
                    const prefData = await res.json();
                    startingCategory = prefData.newsCategory || 'finance';
                    
                    // Update the dropdown UI to match the database
                    if (categorySelect) categorySelect.value = startingCategory;
                }
            } catch (err) {
                console.error("Failed to load preferences", err);
            }
        }
        
        // Fetch news using the database preference
        fetchNews(startingCategory);
    }

    // Start the engine!
    initMarketInsights();
});