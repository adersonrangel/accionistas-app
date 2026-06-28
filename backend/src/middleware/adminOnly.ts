import type { Request, Response, NextFunction } from "express";

// Simple role-based guard – assumes JWT user object exists
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
	console.log("adminOnly middleware called, req.user:", req.user);
	const { role } = req.user || {};
	if (role !== "admin") {
		return res.status(403).json({ error: "Access denied" });
	}
	next();
};

export default adminOnly;
