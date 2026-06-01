const { connectDB } = require('./utils/db');
const Goal = require('./models/Goal');

exports.handler = async function(event, context) {
    await connectDB();
    const method = event.httpMethod;

    try {
        // GET: Fetch all goals for a user
        if (method === 'GET') {
            const email = event.queryStringParameters.email;
            if (!email) return { statusCode: 400, body: 'Email required' };
            const goals = await Goal.find({ email: email });
            return { statusCode: 200, body: JSON.stringify(goals) };
        }

        // Parse incoming data for POST, PUT, DELETE
        const data = event.body ? JSON.parse(event.body) : {};

        // POST: Create a new goal
        if (method === 'POST') {
            const newGoal = new Goal(data);
            await newGoal.save();
            return { statusCode: 200, body: JSON.stringify(newGoal) };
        }

        // PUT: Update an existing goal (Editing or adding savings)
        if (method === 'PUT') {
            const updatedGoal = await Goal.findByIdAndUpdate(data._id, data, { new: true });
            return { statusCode: 200, body: JSON.stringify(updatedGoal) };
        }

        // DELETE: Remove a goal
        if (method === 'DELETE') {
            await Goal.findByIdAndDelete(data._id);
            return { statusCode: 200, body: JSON.stringify({ message: 'Goal deleted' }) };
        }

        return { statusCode: 405, body: "Method Not Allowed" };
    } catch (error) {
        console.error("Goal API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Database operation failed" }) };
    }
};