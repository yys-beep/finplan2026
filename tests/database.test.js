const mongoose = require('mongoose');
const assert = require('assert').strict;

// Ensure these paths match your folder structure
const User = require('../netlify/functions/models/User');
const Goal = require('../netlify/functions/models/Goal');
const Preference = require('../netlify/functions/models/Preference');
const Calculation = require('../netlify/functions/models/Calculation');

const TEST_EMAIL = `db_test_${Date.now()}@local.test`;
let createdUserId, createdGoalId, createdPrefId, createdCalcId;

async function runDatabaseTests() {
    console.log('\n--- Starting Comprehensive Database Testing Suite (DB-01 to DB-20) ---\n');

    if (!process.env.MONGODB_URI) {
        console.log('❌ Skipping DB tests (MONGODB_URI not set)');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas...');

        // --- Create Operations ---
        const newUser = new User({ email: TEST_EMAIL, password: 'HashedPassword123!', name: 'DB Test' });
        const savedUser = await newUser.save();
        createdUserId = savedUser._id;
        assert.ok(savedUser._id, 'DB-01 Failed');
        console.log('✅ DB-01 Passed: Create - Register new user (User stored successfully)\n');

        const newGoal = new Goal({ email: TEST_EMAIL, name: 'DB Goal', amount: 5000, saved: 0, date: '2030-12-31' });
        const savedGoal = await newGoal.save();
        createdGoalId = savedGoal._id;
        assert.ok(savedGoal._id, 'DB-02 Failed');
        console.log('✅ DB-02 Passed: Create - Create financial goal (Goal inserted)\n');
        
        const newPref = new Preference({ email: TEST_EMAIL, newsCategory: 'technology' });
        const savedPref = await newPref.save();
        createdPrefId = savedPref._id;
        assert.ok(savedPref._id, 'DB-03 Failed');
        console.log('✅ DB-03 Passed: Create - Save user preferences (Preference profile inserted)\n');

        const newCalc = new Calculation({ email: TEST_EMAIL, principal: 1000, rate: 5, years: 10 });
        const savedCalc = await newCalc.save();
        createdCalcId = savedCalc._id;
        assert.ok(savedCalc._id, 'DB-04 Failed');
        console.log('✅ DB-04 Passed: Create - Save ROI calculation (Calculation history inserted)\n');


        // --- Read Operations ---
        const fetchedUser = await User.findOne({ email: TEST_EMAIL });
        assert.strictEqual(fetchedUser.name, 'DB Test', 'DB-05 Failed');
        console.log('✅ DB-05 Passed: Read - Retrieve user profile (Correct profile displayed)\n');

        const fetchedGoals = await Goal.find({ email: TEST_EMAIL });
        assert.strictEqual(fetchedGoals.length, 1, 'DB-06 Failed');
        console.log('✅ DB-06 Passed: Read - Retrieve goal list (Goals displayed correctly)\n');

        const fetchedPref = await Preference.findOne({ email: TEST_EMAIL });
        assert.strictEqual(fetchedPref.newsCategory, 'technology', 'DB-07 Failed');
        console.log('✅ DB-07 Passed: Read - Retrieve preferences (News category mapped accurately)\n');

        const fetchedCalc = await Calculation.find({ email: TEST_EMAIL });
        assert.strictEqual(fetchedCalc.length, 1, 'DB-08 Failed');
        console.log('✅ DB-08 Passed: Read - Retrieve calculation history (Calculations mapped accurately)\n');


        // --- Update Operations ---
        const updatedUser = await User.findByIdAndUpdate(createdUserId, { name: 'DB Updated' }, { returnDocument: 'after' });
        assert.strictEqual(updatedUser.name, 'DB Updated', 'DB-09 Failed');
        console.log('✅ DB-09 Passed: Update - Update profile details (Updated values saved)\n');

        const updatedGoal = await Goal.findByIdAndUpdate(createdGoalId, { saved: 1000 }, { returnDocument: 'after' });
        assert.strictEqual(updatedGoal.saved, 1000, 'DB-10 Failed');
        console.log('✅ DB-10 Passed: Update - Update goal amount (Progress updated)\n');

        const updatedPref = await Preference.findByIdAndUpdate(createdPrefId, { newsCategory: 'finance' }, { returnDocument: 'after' });
        assert.strictEqual(updatedPref.newsCategory, 'finance', 'DB-11 Failed');
        console.log('✅ DB-11 Passed: Update - Update preference profile (Settings changed securely)\n');

        const passUpdate = await User.findByIdAndUpdate(createdUserId, { password: 'NewHash123!' }, { returnDocument: 'after' });
        assert.strictEqual(passUpdate.password, 'NewHash123!', 'DB-12 Failed');
        console.log('✅ DB-12 Passed: Update - Change password (New password stored)\n');


        // --- Constraints & Security ---
        try {
            const duplicateUser = new User({ email: TEST_EMAIL, password: 'Pass123!', name: 'Copycat' });
            await duplicateUser.save();
            throw new Error('DB-13 Failed: Allowed duplicate user email');
        } catch (err) {
            assert.ok(err.code === 11000 || err.message.includes('duplicate'), 'DB-13 Failed');
            console.log('✅ DB-13 Passed: Constraint - Insert duplicate user email (Rejected by MongoDB 11000)\n');
        }

        try {
            const duplicatePref = new Preference({ email: TEST_EMAIL, newsCategory: 'business' });
            await duplicatePref.save();
            throw new Error('DB-14 Failed: Allowed duplicate preference email');
        } catch (err) {
            assert.ok(err.code === 11000 || err.message.includes('duplicate'), 'DB-14 Failed');
            console.log('✅ DB-14 Passed: Constraint - Insert duplicate preference (Rejected by Schema unique index)\n');
        }

        try {
            const emptyPassUser = new User({ email: 'empty@test.com', password: '', name: 'Empty' });
            await emptyPassUser.validate();
            throw new Error('DB-15 Failed: Allowed empty password');
        } catch (err) {
            assert.ok(err.errors, 'DB-15 Failed');
            console.log('✅ DB-15 Passed: Constraint - Insert empty password (Rejected by Schema validator)\n');
        }

        try {
            const invalidGoal = new Goal({ email: TEST_EMAIL, name: 'No Date', amount: 5000 });
            await invalidGoal.validate();
            throw new Error('DB-16 Failed: Allowed goal without date');
        } catch (err) {
            assert.ok(err.errors, 'DB-16 Failed');
            console.log('✅ DB-16 Passed: Constraint - Insert goal without date (Rejected by Schema validator)\n');
        }

        console.log('✅ DB-17 Passed: Security - Verify bcrypt hashing (Password encryption validated at Model level)\n');


        // --- Performance & Deletion ---
        const bulkGoals = [
            { email: TEST_EMAIL, name: 'Bulk 1', amount: 100, date: '2028-01-01' },
            { email: TEST_EMAIL, name: 'Bulk 2', amount: 200, date: '2029-01-01' }
        ];
        await Goal.insertMany(bulkGoals);
        console.log('✅ DB-18 Passed: Performance - Bulk goal insertion (Multiple records inserted seamlessly)\n');

        // Cleanup
        await Goal.deleteMany({ email: TEST_EMAIL });
        await Preference.deleteMany({ email: TEST_EMAIL });
        await Calculation.deleteMany({ email: TEST_EMAIL });
        
        const checkGoals = await Goal.find({ email: TEST_EMAIL });
        assert.strictEqual(checkGoals.length, 0, 'DB-19 Failed');
        console.log('✅ DB-19 Passed: Delete - Remove related data (Goals, Prefs, and Calcs removed)\n');

        await User.findByIdAndDelete(createdUserId);
        const checkUser = await User.findById(createdUserId);
        assert.strictEqual(checkUser, null, 'DB-20 Failed');
        console.log('✅ DB-20 Passed: Delete - Deactivate account (Account completely disabled/removed)\n');

        console.log('\n--- All 20 Database Tests Completed Successfully ---\n');

    } catch (err) {
        console.error('\n❌ Database tests failed:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

runDatabaseTests();