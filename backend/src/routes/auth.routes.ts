import { Router } from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.ts";
import {
	findUserByName,
	seedIfEmpty,
	verifyPassword,
} from "../models/user.model.ts";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

// Single entry point to the system: validates credentials against the
// users collection and issues a JWT carrying { username, role }.
router.post("/login", async (req, res) => {
	const { username, password } = req.body ?? {};

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Username and password are required" });
	}

	try {
		// Dev bootstrap: make sure the default admin exists.
		await seedIfEmpty();
		const user = await findUserByName(username);
		if (!user || !verifyPassword(password, user.passwordHash)) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ username: user.username, role: user.role },
			JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.json({ token, username: user.username, role: user.role });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Current user for the presented token.
router.get("/me", authMiddleware, (req, res) => {
	res.json({ username: req.user?.username, role: req.user?.role });
});

export default router;