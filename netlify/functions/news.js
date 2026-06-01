// Netlify Functions use native fetch in modern Node environments
exports.handler = async function(event, context) {
    // 1. Get the query and the page number from the URL
    const query = event.queryStringParameters.q || 'finance';
    const page = event.queryStringParameters.page || 1; // Default to page 1 if missing
    
    // Grab the API key from Netlify's Environment Variables
    const API_KEY = process.env.NEWS_API_KEY;

    try {
        // 2. Add the &page=${page} variable to the NewsAPI request
        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=9&page=${page}&apiKey=${API_KEY}`
        );
        const data = await response.json();

        // Return the JSON data to your frontend
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("News Fetch Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch news' })
        };
    }
};