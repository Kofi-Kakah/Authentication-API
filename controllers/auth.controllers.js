import crypto from "crypto";
import User from "../model/user.model.js";
import { generateToken } from "../config/utils/generateToken.js";
import { sendEmail } from "../config/utils/sendEmail.js";

const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
});

const verificationUrl = (token) =>
    `${process.env.APP_URL || "http://localhost:3000"}/api/v1/auth/verify-email/${token}`;

const sendVerificationEmail = async (user) => {
    const token = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const url = verificationUrl(token);
    await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify your email: ${url}`
    });
    return url;
};

export const signup = async (req,res) => {
    
    try {
        const { email, name, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: "All fields are require"})
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email pattern is wrong"})
        }

        const existingEmail = await User.findOne({email})
        if(existingEmail) {
            return res.status(400).json({ message: "User already exist"})
        }

        if(password.length < 6) {
            return res.status(400).json({ message: "Password must be greater than 6"})
        }

        //Hash Password
        const newUser = new User({ email, name, password });
        await newUser.save();
        const verificationUrlValue = await sendVerificationEmail(newUser);

        return res.status(201).json({
            ...publicUser(newUser),
            message: "Registration successful. Check your email to verify your account.",
            ...(process.env.NODE_ENV === "development" && { verificationUrl: verificationUrlValue })
        })

    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error"})
    }
}

export const login = async (req,res) => {
  try{
        const { name, email, password } = req.body;
        const identifier = email?.toLowerCase() || name;
        const matchingUsers = await User.find(email ? { email: identifier } : { name });
        if (!email && matchingUsers.length > 1) {
                return res.status(400).json({ message: "Multiple accounts use this name. Log in with your email" });
        }
        const user = matchingUsers[0];
    const isPasswordCorrect = await user?.comparePassword(password || "");

        if((!name && !email) || !isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid username or password"})
    }

    if (!user.isVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const token = generateToken(user._id, res);
    return res.status(200).json({ ...publicUser(user), token })

  } catch (error) {
    res.status(500).json({ error: error.message || "User not found"})
  }
}

export const logout = async (req,res) => {
    try{
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message: "Logged out successfully"})
    } catch (error) {
        res.status(500).json({ error: error.message || "Error occur while logging out"})
    }
}

export const getCurrentUser = (req, res) => {
    return res.status(200).json(publicUser(req.user));
};

export const getAdminDashboard = (req, res) => {
    return res.status(200).json({ message: "Admin access granted", user: publicUser(req.user) });
};

export const verifyEmail = async (req, res) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Verification token is invalid or expired" });

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Unable to verify email" });
    }
};

export const forgotPassword = async (req, res) => {
    const genericResponse = { message: "If that email exists, a password reset link has been sent" };
    try {
        const user = await User.findOne({ email: req.body.email?.toLowerCase() });
        if (!user) return res.status(200).json(genericResponse);

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        await sendEmail({
            to: user.email,
            subject: "Reset your password",
            text: `Reset your password with this token: ${resetToken}. Submit it to ${process.env.APP_URL || "http://localhost:3000"}/api/v1/auth/reset-password/${resetToken}`
        });
        return res.status(200).json(genericResponse);
    } catch (error) {
        return res.status(500).json({ error: error.message || "Unable to process password reset" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ message: "Reset token is invalid or expired" });

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Unable to reset password" });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email?.toLowerCase() });
        if (!user || user.isVerified) {
            return res.status(200).json({ message: "If the account exists and is unverified, a verification email has been sent" });
        }

        const url = await sendVerificationEmail(user);
        return res.status(200).json({
            message: "Verification email sent",
            ...(process.env.NODE_ENV === "development" && { verificationUrl: url })
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Unable to resend verification email" });
    }
};