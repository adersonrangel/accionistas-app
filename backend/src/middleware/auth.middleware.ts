import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

export interface AuthUser {
	username: string;
	role: string;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
	console.log("authMiddleware called, header:", req.headers.authorization);
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ error: "No authorization header" });
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		return res.status(401).json({ error: "Invalid authorization format" });
	}

	const token = parts[1];
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
		req.user = decoded;
		console.log("authMiddleware: token decoded successfully:", decoded);
		next();
	} catch {
		console.log("authMiddleware: token verification failed");
		return res.status(403).json({ error: "Invalid or expired token" });
	}
};

export default authMiddleware;
