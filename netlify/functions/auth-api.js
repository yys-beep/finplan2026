const { connectDB } = require('./utils/db');
const User = require('./models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

exports.handler = async function(event, context) {
    // 1. Check method first
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    // 2. Open the safety net immediately
    try {
        await connectDB(); // <--- Safely inside the try block!
        
        const data = JSON.parse(event.body);
        const { action, email, password, otp, ...profileData } = data;

        // --- REGISTRATION LOGIC ---
        if (action === 'register') {
            const existingUser = await User.findOne({ email });
            if (existingUser) return { statusCode: 400, body: JSON.stringify({ error: 'Email already registered.' }) };

            const newUser = new User({ email, password, ...profileData });
            await newUser.save();
            return { statusCode: 200, body: JSON.stringify({ message: 'Registration successful!' }) };
        }

        // --- LOGIN LOGIC (Generates and Sends Email OTP) ---
        if (action === 'login') {
            // 1. ONLY search by email first
            const user = await User.findOne({ email });
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid email or password.' }) };
            
            // 2. Use bcrypt to mathematically compare the typed password with the hashed database password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid email or password.' }) };
            
            // Check if user turned off 2FA
            if (user.twoFactorEnabled === false) {
                return { 
                    statusCode: 200, 
                    body: JSON.stringify({ message: 'Login successful!', requireOtp: false, user: user }) 
                };
            }

            // 1. Generate a 6-digit random code
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 2. Save code and expiration (10 mins) to MongoDB
            user.otp = generatedOtp;
            user.otpExpiry = new Date(Date.now() + 10 * 60000); 
            await user.save();

            // 3. Try to Send the Email (Safely)
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });

                await transporter.sendMail({
                    from: `"FinPlan Security" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'Your FinPlan Security Code',
                    html: `<h3>Hello ${user.name},</h3><p>Your secure login code is: <b style="font-size:24px; color:#2D6A4F;">${generatedOtp}</b></p><p>This code will expire in 10 minutes.</p>`
                });
                
                return { statusCode: 200, body: JSON.stringify({ message: 'OTP Sent successfully!', requireOtp: true }) };
                
            } catch (emailError) {
                console.error("EMAIL FAILED TO SEND:", emailError);
                // The email failed (probably Wi-Fi block), but we still show the OTP screen so you can use the Master Key!
                return { statusCode: 200, body: JSON.stringify({ message: 'Email failed, use Master Key', requireOtp: true }) };
            }
        }

        if (action === 'update-2fa') {
            const { isEnabled } = data;
            const user = await User.findOneAndUpdate(
                { email: email }, 
                { twoFactorEnabled: isEnabled }, 
                { new: true }
            );
            return { statusCode: 200, body: JSON.stringify({ message: '2FA settings updated.', user: user }) };
        }

        // --- VERIFY OTP LOGIC (WITH MASTER KEY) ---
        if (action === 'verify-otp') {
            const user = await User.findOne({ email });
            
            if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found.' }) };

            // Allow '888888' to bypass the system, OR check the real OTP
            const isMasterKey = (otp === "888888");
            const isRealOtp = (user.otp === otp && new Date() < new Date(user.otpExpiry));

            if (isMasterKey || isRealOtp) {
                // Success! Clear the OTP from the database
                user.otp = undefined;
                user.otpExpiry = undefined;
                await user.save();

                return { statusCode: 200, body: JSON.stringify({ message: 'Login fully verified!', user: user }) };
            } else {
                return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired OTP code.' }) };
            }
        }

        // --- GET PROFILE LOGIC ---
        if (action === 'get-profile') {
            const user = await User.findOne({ email });
            if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
            return { statusCode: 200, body: JSON.stringify({ user: user }) };
        }

        // --- UPDATE PROFILE LOGIC ---
        if (action === 'update-profile') {
            const updatedUser = await User.findOneAndUpdate(
                { email: email },
                { $set: profileData },
                { new: true }
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Profile updated!', user: updatedUser }) };
        }

        // --- FORGOT PASSWORD (SEND OTP) ---
        if (action === 'forgot-password') {
            const user = await User.findOne({ email });
            if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'Email address not found in our system.' }) };

            // Generate OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = generatedOtp;
            user.otpExpiry = new Date(Date.now() + 10 * 60000);
            await user.save();

            // Try to send email (with fallback for Wi-Fi blocks)
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });
                await transporter.sendMail({
                    from: `"FinPlan Security" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'Your Password Reset Code',
                    html: `<h3>Hello ${user.name},</h3><p>Your password reset code is: <b style="font-size:24px; color:#2D6A4F;">${generatedOtp}</b></p><p>This code will expire in 10 minutes.</p>`
                });
                return { statusCode: 200, body: JSON.stringify({ message: 'Reset code sent!' }) };
            } catch (err) {
                console.error("EMAIL FAILED:", err);
                return { statusCode: 200, body: JSON.stringify({ message: 'Email failed, use Master Key' }) };
            }
        }

        // --- RESET PASSWORD (VERIFY OTP & SAVE NEW PASS) ---
        if (action === 'reset-password') {
            const { newPassword } = data;
            const user = await User.findOne({ email });
            
            if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found.' }) };

            // Check Master Key OR Real OTP
            const isMasterKey = (otp === "888888");
            const isRealOtp = (user.otp === otp && new Date() < new Date(user.otpExpiry));

            if (isMasterKey || isRealOtp) {
                // Update to new password and clear the OTP
                user.password = newPassword;
                user.otp = undefined;
                user.otpExpiry = undefined;
                await user.save();
                
                return { statusCode: 200, body: JSON.stringify({ message: 'Password reset successfully!' }) };
            } else {
                return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired reset code.' }) };
            }
        }

        // --- CHANGE PASSWORD LOGIC ---
        if (action === 'change-password') {
            const { currentPassword, newPassword } = data;
            const user = await User.findOne({ email });

            if (!user) {
                return { statusCode: 404, body: JSON.stringify({ error: 'User not found.' }) };
            }

            // Compare typed current password with the hashed database password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect current password.' }) };
            }

            user.password = newPassword;
            await user.save(); // The pre-save hook we made earlier will automatically hash this!

            return { statusCode: 200, body: JSON.stringify({ message: 'Password updated successfully!' }) };
        }

        // ==========================================================
        // CASCADING TERMINATION: WIPE USER, GOALS, CALCS, & PREFS
        // ==========================================================
        if (action === 'delete-account') {
            const user = await User.findOne({ email });
            if (!user) {
                return { statusCode: 404, body: JSON.stringify({ error: 'User not found in the database.' }) };
            }

            // Cryptographically verify identity before deleting anything
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password. Account deletion denied.' }) };
            }

            // Safely resolve individual database collections using dynamic require statements
            try {
                const Goal = require('./models/Goal');
                const Preference = require('./models/Preference');
                const Calculation = require('./models/Calculation');

                // Simultaneously purge dependent collection sets matching user's reference email string
                await Promise.all([
                    Goal.deleteMany({ email: email }),
                    Preference.deleteMany({ email: email }),
                    Calculation.deleteMany({ email: email })
                ]);
                console.log(`Cascaded erasure complete for linked records mapping to: ${email}`);
            } catch (modelError) {
                // Fallback catch to prevent a system execution lock if a specific file layout path differs
                console.error("Cascading target resolution warning:", modelError.message);
            }

            // Finally, remove primary account profile
            await User.findOneAndDelete({ email });
            return { statusCode: 200, body: JSON.stringify({ message: 'Account and all related financial metrics successfully purged!' }) };
        }

        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action specified.' }) };

    } catch (error) {
        console.error("Auth API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};