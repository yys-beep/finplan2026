const { connectDB } = require('./utils/db');
const Calculation = require('./models/Calculation');

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