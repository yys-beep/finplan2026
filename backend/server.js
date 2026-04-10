const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

// API route (your frontend will call this)
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

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
console.log("API KEY:", process.env.NEWS_API_KEY);