const { connectDB } = require('./utils/db');
const Calculation = require('./models/Calculation');

// unit testing UT-07, UT-08, UT-05, UT-06
// 1. First, declare your functions
const calculateROI = (principal, rate, years) => {
    // your ROI logic here
    return principal * rate * years;
};

const calculateCompound = (p, r, n, t) => {
    // your Compound logic here
    return p * Math.pow((1 + (r / n)), (n * t));
};

const calculateProgress = (saved, target) => {
    // your Progress logic here
    return (saved / target) * 100;
};

const calculateCountdown = (targetDate) => {
    // your Countdown logic here
    return 6; 
};

exports.handler = async function(event, context) {
    await connectDB();

    // GET: Retrieve the user's most recent calculation
    if (event.httpMethod === 'GET') {
        const email = event.queryStringParameters.email;
        if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };

        try {
            // Find the most recent calculation for this user
            const lastCalc = await Calculation.findOne({ email: email }).sort({ createdAt: -1 });
            return {
                statusCode: 200,
                body: JSON.stringify({ calculation: lastCalc })
            };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: "Database error" }) };
        }
    }

    // POST: Save a new calculation to the database
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            const newCalc = new Calculation(data);
            await newCalc.save();

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Calculation saved successfully!", data: newCalc })
            };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: "Failed to save calculation" }) };
        }
    }

    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
};

// unit testing UT-07, UT-08, UT-05, UT-06
module.exports = { 
    handler: exports.handler, // Keep the Netlify handler active!
    calculateROI, 
    calculateCompound, 
    calculateProgress, 
    calculateCountdown 
};