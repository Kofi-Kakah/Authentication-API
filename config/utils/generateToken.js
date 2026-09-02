import jwt from "jsonwebtoken"

// Create and send a JWT for the authenticated user.
export const generateToken = (userId, res) => {
	// Read the signing secret from the environment instead of hard-coding it.
	const secret = process.env.JWT_SECRET;

	// Stop immediately if the application has not been configured with a secret.
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}

	// Sign the user's ID into a token that expires after seven days.
	const token = jwt.sign({ userId }, secret, { expiresIn: "7d" });

	// Store the token in a browser cookie that client-side JavaScript cannot read.
	res.cookie("jwt", token, {
		// Prevent JavaScript from accessing the authentication cookie.
		httpOnly: true,
		// Send the cookie securely in production, while allowing local HTTP development.
		secure: process.env.NODE_ENV !== "development",
		// Reduce cross-site request risks for this authentication cookie.
		sameSite: "strict",
		// Keep the cookie lifetime aligned with the JWT lifetime.
		maxAge: 7 * 24 * 60 * 60 * 1000
	});

	// Return the token so callers can also use it in tests or non-browser clients.
	return token;
};