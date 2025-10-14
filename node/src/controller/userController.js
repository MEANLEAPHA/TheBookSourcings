const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config();
// const calculateAlertTimes = require('../service/sendAlert'); not yet 
const { sendPinCodeEmail, sendResendPinEmail, sendResetPasswordPinEmail} = require('../util/email');
const { createToken } = require('../util/jwtHelp'); // adjust path if needed


// login logical 
const loginMember = async (req, res) => {
    try {
        const { email, password, timezone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password"});
        }

        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json(
              { message: "No user found ! " }
            );
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password! Please try again :("});
        }

        if (user.status !== 'verified') {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                Result: "False",
                needsVerification: true // Optional flag to indicate verification required
            });
        }

        if (timezone) {
            await db.query("UPDATE users SET timezone = ? WHERE user_id = ?", [timezone, user.user_id]);
            user.timezone = timezone; // Ensure updated timezone is included
        }

        const token = createToken({
            user_id: user.user_id,
            memberQid: user.memberQid,
            username: user.username,
            email: user.email,
            timezone: user.timezone || 'UTC'
        });


        res.json({
            message: "Login successful :)",
            token,
            user_id: user.user_id,
            username: user.username,
            timezone: user.timezone || 'UTC',
            Result: "True"
        });

    } catch (error) {
        console.error("Error in loginMember:", error);
        res.status(500).json({ message: "Internal server error. Our team is working on it. sorry :(", Result: "False" });
    }
};



//signup or rigister logical 
const createMember = async (req, res) => {
  try {
    const { username, email, password, timezone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields :)", Result: "False" });
    }
    // const normalizedEmail = email.trim().toLowerCase();
    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Generate 6-digit PIN code
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user with pin_code and status = 'unverified', pin_created_at = now()
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, timezone, pin_code, pin_created_at, status)
       VALUES (?, ?, ?, ?, ?, NOW(), 'unverified')`,
      [username, email, hash, timezone || 'UTC', pinCode]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Error creating member",  });
    }

    // Send the PIN code via email
    await sendPinCodeEmail(email, pinCode);

    // Optionally create a token here for verification page access (e.g. with user_id)
    // Example:
    // You need the new user's email as well — since you inserted it, you have it in req.body.email
      const token = createToken({
        user_id: result.insertId,
        username,
        email,
        timezone: timezone || 'UTC'
      });



    res.status(201).json({
      message: "Registration successfully, please check your email for the verification code.",
      user_id: result.insertId,
      token,
      Result: "True"
      // token
    });

  } catch (error) {
    console.error("Error in createMember:", error);
    res.status(500).json({ message: "This email is already registered...!",});
  }
};


// verifyMember email before login logical
const verifyMember = async (req, res) => {
  const { pin } = req.body;
  const email = req.user.email; // from JWT middleware

  console.log("verifyMember email from token:",email);
  console.log("PIN from request:", pin);

  try {
    const pinTrimmed = pin.trim();

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND pin_code = ?',
      [email, pinTrimmed]
    );

    if (!users || users.length === 0) {
      console.log("No matching user or invalid PIN");
      return res.status(400).json({ message: 'Invalid PIN code.' });
    }

    const user = users[0];
    console.log("User found:", user);

    const pinAgeMinutes = (Date.now() - new Date(user.pin_created_at).getTime()) / 60000;

    if (pinAgeMinutes > 10) {
      console.log("PIN expired");
      return res.status(400).json({ message: 'PIN code expired. Please request a new one :)' });
    }

    // Update status and clear PIN
    await db.query(
      'UPDATE users SET status = ?, pin_code = NULL, pin_created_at = NULL WHERE email = ?',
      ['verified', email]
    );

    console.log("Email verified successfully for", email);
    return res.json({ message: 'Email verified successfully!' });

  } catch (err) {
    console.error("Error in verifyMember:", err);
    return res.status(500).json({ message: 'Server error during verification. Our team is working on it. Sorry :(' });
  }
};

// user forget their password when login logical
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Please provide your email" });

  const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (!user) return res.status(404).json({ message: "No user found with this email! o_o" });

  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

  await db.query(`
    UPDATE users SET pin_code = ?, pin_created_at = NOW() WHERE email = ?
  `, [pinCode, email]);

  await sendResetPasswordPinEmail(email, pinCode); // Reuse the existing function

  res.json({ message: "PIN has been sent to your email, please check your email :)" });
};





const resendPin = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Generate new 6-digit PIN
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = new Date();

    // Update pin and timestamp in DB
    await db.query(
      `UPDATE users SET pin_code = ?, pin_created_at = ? WHERE user_id = ?`,
      [pinCode, createdAt, userId]
    );

    // Get user's email
    const [[user]] = await db.query(`SELECT email FROM users WHERE user_id = ?`, [userId]);

    // Use the resend email function from email.js
    await sendResendPinEmail(user.email, pinCode);

    res.json({ message: "New verification code has been sent. Please check your email." });

  } catch (error) {
    console.error("Resend PIN error:", error);
    res.status(500).json({ message: "Server failed to resend PIN code. Our team is working on it. Sorry :(" });
  }
};



















const verifyResetPin = async (req, res) => {
  const { email, pin } = req.body;

  const [[user]] = await db.query(
    "SELECT * FROM users WHERE email = ? AND pin_code = ?",
    [email, pin.trim()]
  );

  if (!user) return res.status(400).json({ message: "Invalid PIN" });

  const pinAgeMinutes = (Date.now() - new Date(user.pin_created_at).getTime()) / 60000;

  if (pinAgeMinutes > 10) {
    return res.status(400).json({ message: "PIN expired. Please request a new one." });
  }

  res.json({ message: "PIN verified. You can now reset your password." });
};


const resetPassword = async (req, res) => {
  const { email, pin, newPassword } = req.body;

  if (!email  || !pin || !newPassword) {
    return res.status(400).json({ message: "Missing fields" ,});
  }

  const [[user]] = await db.query(
    "SELECT * FROM users WHERE email = ? AND pin_code = ?",
    [email, pin.trim()]
  );

  if (!user) return res.status(400).json({ message: "Invalid PIN or Email" });

  const pinAgeMinutes = (Date.now() - new Date(user.pin_created_at).getTime()) / 60000;
  if (pinAgeMinutes > 10) {
    return res.status(400).json({ message: "PIN expired. Please request a new one." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.query(`
    UPDATE users SET password = ?, pin_code = NULL, pin_created_at = NULL WHERE email = ?
  `, [hashedPassword, email]);

  res.json({ message: "Password reset successfully :)" });


};

const updatePassword = async (req, res) => {
  const { email, newPassword, pin } = req.body;

  if (!email || !newPassword || !pin) {
    return res.status(400).json({ message: "Email, PIN, and new password are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPin = pin.trim();

    // Check if the user with matching PIN exists
    const [[user]] = await db.query(
      "SELECT * FROM users WHERE email = ? AND pin_code = ?",
      [normalizedEmail, trimmedPin]
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid email or PIN" });
    }

    // Check if the PIN is still valid (within 10 minutes)
    const pinAgeMinutes = (Date.now() - new Date(user.pin_created_at).getTime()) / 60000;
    if (pinAgeMinutes > 10) {
      return res.status(400).json({ message: "PIN has expired, please request a new one" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear PIN
    await db.query(
      `UPDATE users SET password = ?, pin_code = NULL, pin_created_at = NULL WHERE email = ?`,
      [hashedPassword, normalizedEmail]
    );

    return res.json({ message: "Password updated successfully. You can now log in." });

  } catch (error) {
    console.error("Error in updatePassword:", error);
    return res.status(500).json({ message: "Server error during password update" });
  }
};

const resendResetPin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if the user exists
  const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (!user) {
    return res.status(404).json({ message: "No user found with this email" });
  }

  // Generate a new PIN
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Save it to the database with new timestamp
  await db.query(
    `UPDATE users SET pin_code = ?, pin_created_at = NOW() WHERE email = ?`,
    [pinCode, email]
  );

  // Send email using your existing function
  await sendResetPasswordPinEmail(email, pinCode);

  res.json({ message: "A new PIN has been sent to your email." });
};

const changePassword = async (req, res) => {
  const userId = req.user.user_id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Missing current or new password." });
  }

  const [[user]] = await db.query("SELECT password FROM users WHERE user_id = ?", [userId]);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Incorrect current password." });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, userId]);

  res.json({ message: "Password updated successfully." });
};



const updateAccount = async (req, res)=>{
 try {

    const { user_id, username, email, timezone } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

    // if (existingTask.length === 0) {
    //   return res.status(403).json({ message: "Unauthorized or task not found", Result: "False" });
    // }

    const [result] = await db.query(
      `UPDATE users SET username = ?, email = ?, timezone = ? WHERE user_id = ? `,
      [username, normalizedEmail , timezone, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Account not updated", Result: "False" });
    }

    const [listUser] = await db.query("SELECT * FROM users WHERE user_id = ?", [user_id]);

    res.json({ message: "Account updated successfully", user: listUser });

  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
const fullRegister = async(req,res) =>{
  try{
    const memberQid = req.user.memberQid
    const {
      fullname,
      nickname,
      dob,
      gender,
      work,
      nationlity,
      workPlace,
      workRole,
      websiteLink,
      bio,
      authorQid
    } = req.body

    const [update] = await db.query(
      `UPDATE users SET fullname = ?, nickname = ?, DOB = ?, gender = ?, work = ?, nationality = ?, workPlace = ?, workRole = ?, websiteUrl = ?, bio = ?, authorQid = ? WHERE memberQid = ?`,
      [fullname, nickname, dob, gender, work, nationlity, workPlace, workRole, websiteLink, bio, authorQid, memberQid]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ message: "Account not updated", Result: "False" });
    }

    res.json({ message: "successfully submit" });


  }
 catch(error){
  console.error("Error in fullRegisterController:", error);
  return res.status(500).json({ message: "failed to sumbit the full register" });
 }
}

module.exports ={
    loginMember,
    createMember,
    updateAccount,
    resetPassword,
    updatePassword,
    resendResetPin,
    changePassword,
    verifyMember,
    requestPasswordReset,
    resendPin,
    verifyResetPin,
    fullRegister
}