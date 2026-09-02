import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import { generateToken } from "../config/utils/generateToken.js";

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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({ email, name, password:hashedPassword})
        generateToken(newUser._id,res);
        await newUser.save();

        return res.status(201).json({
            _id: newUser._id,
            name:newUser.name,
            email:newUser.email,
        })

    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error"})
    }
}

export const login = async (req,res) => {
  try{
    const { name, password } = req.body;
    const user = await User.findOne({ name });
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")

    if(!name || !isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid username or password"})
    }

    generateToken(user._id, res);
    return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email
     })

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