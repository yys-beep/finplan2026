// Netlify Functions use native fetch in modern Node environments
exports.handler = async function(event, context) {
    // Get the query from the URL (e.g., ?q=finance)
    const query = event.queryStringParameters.q || 'finance';
    
    // Grab the API key from Netlify's Environment Variables
    const API_KEY = process.env.NEWS_API_KEY;

    try {
        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=9&apiKey=${API_KEY}`
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