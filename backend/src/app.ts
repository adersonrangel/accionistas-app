import express from "express";
import cors from "cors";
import accionistasRoutes from "./routes/accionistas.js";
import authRoutes from "./routes/auth.routes.ts";
import authMiddleware from "./middleware/auth.middleware.ts";
import shareRoutes from "./routes/share.routes.ts";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", service: "hotel-accionistas-backend" });
});

// Auth routes
app.use("/api", authRoutes);

// API routes
app.use("/api/accionistas", accionistasRoutes);

// Share routes with auth guard
app.use("/api/shareholders/:shareholderId/shares", authMiddleware, shareRoutes);

// Error handler genérico
app.use(
	(
		err: any,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		console.error(err.stack);
		res.status(500).json({ error: "Error interno del servidor" });
	},
);

export default app;
