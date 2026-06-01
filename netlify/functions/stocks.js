exports.handler = async function(event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

    const API_KEY = process.env.ALPHA_VANTAGE_KEY;
    // We will track three major indicators: Apple, Tesla, and the S&P 500 Index ETF
    const symbols = ['AAPL', 'TSLA', 'SPY']; 
    let stockData = [];

    try {
        for (const symbol of symbols) {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
            
            // USING NATIVE FETCH INSTEAD OF AXIOS
            const response = await fetch(url);
            const data = await response.json();
            
            // Check if Alpha Vantage cut us off (Rate Limit Reached)
            if (data.Information || data.Note) {
                console.warn("Alpha Vantage Rate Limit Reached! Using Safe Fallback Data.");
                throw new Error("RATE_LIMIT"); 
            }

            const quote = data['Global Quote'];
            if (quote && quote['01. symbol']) {
                stockData.push({
                    symbol: quote['01. symbol'],
                    price: parseFloat(quote['05. price']).toFixed(2),
                    change: parseFloat(quote['09. change']).toFixed(2),
                    changePercent: quote['10. change percent']
                });
            }
        }

        return { statusCode: 200, body: JSON.stringify({ status: "ok", data: stockData }) };

    } catch (error) {
        console.error("Stock API Error:", error.message);
        // FALLBACK: If the API fails or hits the 25/day limit, return realistic mock data so the UI doesn't crash!
        const fallbackData = [
            { symbol: 'AAPL', price: '173.50', change: '+1.25', changePercent: '+0.72%' },
            { symbol: 'TSLA', price: '188.20', change: '-3.40', changePercent: '-1.77%' },
            { symbol: 'SPY', price: '508.12', change: '+2.10', changePercent: '+0.41%' }
        ];
        return { statusCode: 200, body: JSON.stringify({ status: "mock", data: fallbackData }) };
    }
};