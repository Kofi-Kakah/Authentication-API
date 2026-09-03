import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

export const protect = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        const bearerToken = authorization?.startsWith("Bearer ")
            ? authorization.substring(7)
            : null;
        const token = req.cookies.jwt || bearerToken;
        if (!token) return res.status(401).json({ message: "Authentication required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: "User no longer exists" });
        if (user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({ message: "Password was changed. Please log in again" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired authentication token" });
    }
};

export const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
};
