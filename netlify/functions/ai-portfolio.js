exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { income, riskLevel, goals } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);
        const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved || 0), 0);
        const goalNames = goals.map(g => g.name).join(", ");

        // Try REAL AI if API Key exists
        if (API_KEY && API_KEY.length > 10) {
            try {
                const prompt = `Act as a wealth manager. The user has RM ${income} monthly income and a ${riskLevel} risk tolerance. They are saving for: ${goalNames || 'general wealth'}. Total target: RM ${totalTarget}. Saved so far: RM ${totalSaved}. Give a customized, 3-sentence holistic investment strategy. Be professional and encouraging.`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                const aiData = await response.json();
                return { statusCode: 200, body: JSON.stringify({ advice: aiData.candidates[0].content.parts[0].text }) };
            } catch (apiError) {
                console.log("Real AI failed, falling back to simulation.");
            }
        }

        // SIMULATION FALLBACK (Runs if no key, or if API fails)
        let simulatedAdvice = "";
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate thinking time

        if (goals.length === 0) {
            simulatedAdvice = `With a ${riskLevel} risk profile and RM ${income} monthly income, your first step is to establish clear financial targets. Begin by building an emergency fund, then diversify into assets that match your risk appetite.`;
        } else {
            const progress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;
            simulatedAdvice = `You are currently ${progress}% of the way toward your combined target of RM ${totalTarget.toLocaleString()}. Because you have a ${riskLevel} risk tolerance, ensure you are utilizing appropriate investment vehicles (like ${riskLevel === 'High' ? 'ETFs and Equities' : 'Bonds and FDs'}) to outpace inflation and reach your goals for ${goalNames} faster.`;
        }

        return { statusCode: 200, body: JSON.stringify({ advice: simulatedAdvice }) };

    } catch (error) {
        console.error("Portfolio AI Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate holistic advice" }) };
    }
};