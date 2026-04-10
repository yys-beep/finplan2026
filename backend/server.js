// 1. Import all your required packages first
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();
const cors = require('cors');

// 2. Initialize the app
const app = express();
app.use(cors());

// 3. Serve your static files (HTML, CSS, JS) to the web
// (This must come AFTER 'const app = express();')
app.use(express.static(__dirname));

// 4. API route (your frontend will call this)
app.get('/news', async (req, res) => {
    const query = req.query.q || 'finance';

    try {
        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=9&apiKey=${process.env.NEWS_API_KEY}`
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// 5. Dynamic Port (Crucial for Render.com Deployment)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("API KEY LOADED:", process.env.NEWS_API_KEY ? "Yes (Hidden for security)" : "Missing!");
});