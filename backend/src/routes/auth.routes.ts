import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

// Hardcoded admin user for development
const ADMIN_USER = {
	username: "admin",
	password: "admin",
	role: "admin",
};

router.post("/login", (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Username and password are required" });
	}

	if (username !== ADMIN_USER.username || password !== ADMIN_USER.password) {
		return res.status(401).json({ error: "Invalid credentials" });
	}

	const token = jwt.sign(
		{ username: ADMIN_USER.username, role: ADMIN_USER.role },
		JWT_SECRET,
		{ expiresIn: "24h" },
	);

	res.json({ token });
});

export default router;