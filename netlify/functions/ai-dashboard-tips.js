exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { income, riskLevel, goals } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        const goalNames = goals.map(g => g.name).join(", ");
        
        if (API_KEY && API_KEY.length > 10) {
            try {
                // We explicitly ask Gemini to format the response as a JSON array
                const prompt = `Act as a financial dashboard widget. The user has RM ${income} monthly income, a ${riskLevel} risk tolerance, and is saving for: ${goalNames || 'general savings'}. Give exactly 3 short, actionable financial tips (maximum 1 sentence each). Return the output STRICTLY as a valid JSON array of strings, with no markdown formatting or extra text.`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                const aiData = await response.json();
                let rawText = aiData.candidates[0].content.parts[0].text;
                
                // Clean up any markdown code blocks Gemini might accidentally add
                rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const tipsArray = JSON.parse(rawText);

                return { statusCode: 200, body: JSON.stringify({ tips: tipsArray }) };
            } catch (apiError) {
                console.log("Real AI failed, using fallback tips.");
            }
        }

        // SIMULATION FALLBACK (If API Key is missing or fails)
        await new Promise(resolve => setTimeout(resolve, 800));
        const fallbackTips = [
            `Maintain your ${riskLevel} risk strategy by reviewing your asset allocation monthly.`,
            `Aim to keep 6 months of your RM ${income} income in a liquid emergency fund.`,
            goals.length > 0 ? `Automate your savings to hit your targets for ${goalNames} faster!` : `Visit the Goal Planner to set your first financial target.`
        ];

        return { statusCode: 200, body: JSON.stringify({ tips: fallbackTips }) };

    } catch (error) {
        console.error("Dashboard AI Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate tips" }) };
    }
};