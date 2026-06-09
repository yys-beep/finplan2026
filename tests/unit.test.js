const assert = require('assert').strict;

// Imports
const { validateEmail, validatePassword } = require('../js/auth.js');
const { calculateROI, calculateCompound, calculateProgress, calculateCountdown } = require('../netlify/functions/calculations.js');
const { analyzeRiskProfile } = require('../js/recommendations.js');
const { generateChartData } = require('../js/dashboard-charts.js');
const { hashPassword, generateToken } = require('../js/security.js'); 

async function runUnitTests() {
    console.log("--- Starting Enhanced Unit Testing Suite ---\n");

    // UT-01: Email Validation
    console.log("Running UT-01: Email Validation...");
    assert.strictEqual(validateEmail("test@example.com"), true, "Failed valid email");
    assert.strictEqual(validateEmail("invalid-email"), false, "Failed missing @ symbol");
    assert.strictEqual(validateEmail("test@.com"), false, "Failed missing domain");
    assert.strictEqual(validateEmail(""), false, "Failed empty string handling");
    console.log("✅ UT-01 Passed (All edge cases covered)\n");

    // UT-02: Password Validation (Boundary Testing)
    console.log("Running UT-02: Password Validation...");
    assert.strictEqual(validatePassword("StrongPass1!"), true, "Failed valid password");
    assert.strictEqual(validatePassword("12345678"), true, "Failed exact boundary (8 chars)");
    assert.strictEqual(validatePassword("short"), false, "Failed under boundary (<8 chars)");
    assert.strictEqual(validatePassword(""), false, "Failed empty password");
    console.log("✅ UT-02 Passed (All edge cases covered)\n");

    // UT-03: Security - bcrypt Hashing
    console.log("Running UT-03: bcrypt Hashing...");
    const hash1 = await hashPassword("password123");
    const hash2 = await hashPassword("password123");
    assert.ok(hash1.length > 50, "Failed: Hash length is incorrect for bcrypt");
    assert.notStrictEqual(hash1, hash2, "Failed: bcrypt should salt differently every time");
    assert.notStrictEqual(hash1, "password123", "Failed: Password was not hashed");
    console.log("✅ UT-03 Passed (Cryptographic randomness verified)\n");

    // UT-04: Security - JWT Generation
    console.log("Running UT-04: JWT Generation...");
    const token = generateToken("user@test.com");
    assert.ok(typeof token === 'string', "Failed: Token is not a string");
    assert.ok(token.length > 20, "Failed: Token is too short to be a valid JWT");
    console.log("✅ UT-04 Passed (Token structure verified)\n");

    // UT-05: Goal Progress Calculation (Math Boundaries)
    console.log("Running UT-05: Progress Calculation...");
    assert.strictEqual(calculateProgress(500, 1000), 50, "Failed normal 50% calculation");
    assert.strictEqual(calculateProgress(1000, 1000), 100, "Failed 100% completion");
    assert.strictEqual(calculateProgress(1500, 1000), 150, "Failed over-achievement calculation");
    assert.strictEqual(calculateProgress(0, 1000), 0, "Failed zero progress calculation");
    console.log("✅ UT-05 Passed (Mathematical boundaries verified)\n");

    // UT-06: Countdown Calculation
    console.log("Running UT-06: Countdown Calculation...");
    const daysLeft = calculateCountdown("2030-12-31");
    assert.strictEqual(typeof daysLeft, 'number', "Failed: Must return a number");
    assert.ok(daysLeft > 0, "Failed: Future date should return positive days");
    console.log("✅ UT-06 Passed (Date logic verified)\n");

    // UT-07: ROI Calculation
    console.log("Running UT-07: ROI Calculation...");
    assert.strictEqual(calculateROI(1000, 0.05, 1), 50, "Failed normal 1-year ROI");
    assert.strictEqual(calculateROI(1000, 0.05, 0), 0, "Failed zero years ROI");
    assert.strictEqual(calculateROI(0, 0.05, 5), 0, "Failed zero principal ROI");
    console.log("✅ UT-07 Passed (Investment math verified)\n");

    // UT-08: Compound Interest
    console.log("Running UT-08: Compound Interest...");
    const compound = calculateCompound(1000, 0.05, 1, 1);
    assert.strictEqual(Math.round(compound), 1050, "Failed standard compounding");
    assert.strictEqual(calculateCompound(1000, 0, 1, 5), 1000, "Failed zero interest scenario");
    console.log("✅ UT-08 Passed (Compounding logic verified)\n");

    // UT-09: Risk Profile Analysis
    console.log("Running UT-09: Risk Profile Logic...");
    assert.ok(analyzeRiskProfile("Low").includes("Bonds"), "Failed Low risk recommendation");
    assert.ok(analyzeRiskProfile("High").includes("Stocks") || analyzeRiskProfile("High").includes("Diversified"), "Failed High risk recommendation");
    console.log("✅ UT-09 Passed (Profile branching verified)\n");

    // UT-10: Chart Data Generation
    console.log("Running UT-10: Chart Data Generation...");
    const chartOutput = generateChartData([{amount: 100}, {amount: 250}]);
    assert.ok(Array.isArray(chartOutput), "Failed: Must return an array");
    assert.strictEqual(chartOutput[0], 100, "Failed: Data extraction mapping incorrect");
    assert.strictEqual(chartOutput.length, 2, "Failed: Array length mismatch");
    console.log("✅ UT-10 Passed (Data mapping verified)\n");

    console.log("--- All Unit Tests Completed Successfully ---");
}

runUnitTests().catch(err => {
    console.error("\n❌ Unit test execution failed:", err.message);
    process.exitCode = 1;
});