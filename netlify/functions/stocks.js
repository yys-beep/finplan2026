// netlify/functions/stocks.js
exports.handler = async function(event, context) {
    // Get the stock symbol from the URL (e.g., ?symbol=AAPL), default to IBM for testing
    const symbol = event.queryStringParameters.symbol || 'IBM';
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;

    try {
        // Fetch the Global Quote (current price and trend)
        const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
        );
        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Stock Fetch Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch stock data' })
        };
    }
};