const { connectDB } = require('./utils/db');
const Preference = require('./models/Preference');

exports.handler = async function(event, context) {
    // Connect to the database
    await connectDB();

    // GET Request: Load preferences when the user visits the page
    if (event.httpMethod === 'GET') {
        const email = event.queryStringParameters.email;
        if (!email) return { statusCode: 400, body: "Email required" };

        try {
            const userPref = await Preference.findOne({ email: email });
            return {
                statusCode: 200,
                body: JSON.stringify(userPref || { newsCategory: 'finance' })
            };
        } catch (error) {
            return { statusCode: 500, body: "Database error" };
        }
    }

    // POST Request: Save preferences when the user changes the dropdown
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            
            // Update the category, or create a new document if the user doesn't exist yet
            const updatedPref = await Preference.findOneAndUpdate(
                { email: data.email },
                { newsCategory: data.newsCategory },
                { new: true, upsert: true } 
            );

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Preferences saved successfully", data: updatedPref })
            };
        } catch (error) {
            return { statusCode: 500, body: "Failed to save preferences" };
        }
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};