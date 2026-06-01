exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const data = JSON.parse(event.body);
        const { goalName, targetAmount, savedAmount, targetDate, monthlyIncome, riskTolerance } = data;
        
        // Calculate the underlying metrics for the simulation
        const months = Math.max(1, (new Date(targetDate).getFullYear() - new Date().getFullYear()) * 12 + (new Date(targetDate).getMonth() - new Date().getMonth()));
        const amountNeeded = targetAmount - savedAmount;
        const monthlySavingNeeded = amountNeeded / months;
        const incomePercentage = monthlyIncome > 0 ? (monthlySavingNeeded / monthlyIncome) * 100 : 100;
        
        let simulatedAdvice = "";

        // Generate context-aware advice based on the data
        if (incomePercentage > 40) {
            simulatedAdvice = `To reach RM ${targetAmount} for your ${goalName}, you need to save RM ${monthlySavingNeeded.toFixed(0)} monthly, which is a steep ${incomePercentage.toFixed(0)}% of your income. Consider extending your deadline to reduce monthly financial stress.`;
        } else if (incomePercentage > 20) {
            simulatedAdvice = `You are on an ambitious track for your ${goalName}! Saving RM ${monthlySavingNeeded.toFixed(0)} monthly will get you there. Since your risk tolerance is ${riskTolerance}, look into index funds to help your money grow faster.`;
        } else if (savedAmount === 0) {
            simulatedAdvice = `Great goal! To hit RM ${targetAmount} by ${new Date(targetDate).getFullYear()}, you should automate a monthly transfer of RM ${monthlySavingNeeded.toFixed(0)}. Starting today is the most important step.`;
        } else {
            simulatedAdvice = `Excellent progress on your ${goalName}! You only need RM ${monthlySavingNeeded.toFixed(0)} a month to hit your target. Keep up the momentum and ensure these funds are kept in a high-yield account.`;
        }

        // Simulate a slight network delay to mimic an AI processing time (800ms)
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
            statusCode: 200,
            body: JSON.stringify({ advice: simulatedAdvice })
        };

    } catch (error) {
        console.error("AI API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate AI advice" }) };
    }
};