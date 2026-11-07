import { Router } from "express";
import UserModel, {
	hashPassword,
	listUsers,
	toPublic,
} from "../models/user.model.ts";

const router = Router();
const ROLES = ["admin", "user"];

function validRole(role: unknown): role is "admin" | "user" {
	return typeof role === "string" && ROLES.includes(role);
}

// NOTE: every route in this file is mounted behind authMiddleware +
// adminOnly (see app.ts / app.js).

// GET /api/users - list users (never exposes passwordHash)
router.get("/", async (_req, res) => {
	try {
		const data = await listUsers();
		res.json({ data, total: data.length });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /api/users - create user
router.post("/", async (req, res) => {
	try {
		const { username, password, role } = req.body ?? {};
		if (username === undefined || password === undefined) {
			return res
				.status(400)
				.json({ error: "Username and password are required" });
		}
		const clean = String(username).trim().toLowerCase();
		if (clean.length < 3) {
			return res
				.status(400)
				.json({ error: "Username must be at least 3 characters" });
		}
		if (String(password).length < 4) {
			return res
				.status(400)
				.json({ error: "Password must be at least 4 characters" });
		}
		if (!validRole(role)) {
			return res.status(400).json({ error: "Role must be admin or user" });
		}
		const exists = await UserModel.findOne({ username: clean });
		if (exists) {
			return res.status(409).json({ error: "Username already in use" });
		}
		const user = await UserModel.create({
			username: clean,
			passwordHash: hashPassword(password),
			role,
		});
		res.status(201).json({ data: toPublic(user) });
	} catch (err: any) {
		if (err.code === 11000) {
			return res.status(409).json({ error: "Username already in use" });
		}
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// PUT /api/users/:id - update username and/or password and/or role
router.put("/:id", async (req, res) => {
	try {
		const { username, password, role } = req.body ?? {};
		const existing = await UserModel.findById(req.params.id).catch(
			() => null
		);
		if (!existing) {
			return res.status(404).json({ error: "User not found" });
		}
		const update: {
			username?: string;
			passwordHash?: string;
			role?: string;
		} = {};
		if (username !== undefined) {
			const clean = String(username).trim().toLowerCase();
			if (clean.length < 3) {
				return res
					.status(400)
					.json({ error: "Username must be at least 3 characters" });
			}
			const dup = await UserModel.findOne({
				username: clean,
				_id: { $ne: existing._id },
			});
			if (dup) {
				return res.status(409).json({ error: "Username already in use" });
			}
			update.username = clean;
		}
		if (password !== undefined && password !== "") {
			if (String(password).length < 4) {
				return res
					.status(400)
					.json({ error: "Password must be at least 4 characters" });
			}
			update.passwordHash = hashPassword(password);
		}
		if (role !== undefined) {
			if (!validRole(role)) {
				return res
					.status(400)
					.json({ error: "Role must be admin or user" });
			}
			update.role = role;
		}
		if (Object.keys(update).length === 0) {
			return res
				.status(400)
				.json({ error: "Provide 'username', 'password' and/or 'role'" });
		}
		const updated = await UserModel.findByIdAndUpdate(req.params.id, update, {
			new: true,
			runValidators: false,
		});
		if (!updated) {
			return res.status(404).json({ error: "User not found" });
		}
		res.json({ data: toPublic(updated) });
	} catch (err: any) {
		if (err.code === 11000) {
			return res.status(409).json({ error: "Username already in use" });
		}
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /api/users/:id - remove user (cannot delete self or last admin)
router.delete("/:id", async (req, res) => {
	try {
		const existing = await UserModel.findById(req.params.id).catch(
			() => null
		);
		if (!existing) {
			return res.status(404).json({ error: "User not found" });
		}
		if (existing.role === "admin") {
			const admins = await UserModel.countDocuments({ role: "admin" });
			if (admins <= 1) {
				return res
					.status(409)
					.json({ error: "Cannot delete the last admin" });
			}
		}
		if (req.user && existing.username === req.user.username) {
			return res
				.status(409)
				.json({ error: "Cannot delete your own account" });
		}
		await existing.deleteOne();
		res.json({ message: "User deleted successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;