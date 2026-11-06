import express from "express";
import cors from "cors";
import accionistasRoutes from "./routes/accionistas.js";
import authRoutes from "./routes/auth.routes.ts";
import authMiddleware from "./middleware/auth.middleware.ts";
import accionesRoutes from "./routes/acciones.routes.ts";
import accionesAsignacionRoutes from "./routes/acciones-asignacion.routes.ts";
import adminOnly from "./middleware/adminOnly.ts";

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
app.use("/api/acciones", authMiddleware, accionesRoutes);

// Assignment routes (auth + admin) nested under accionista.
// Express 4 `use()` does not capture :id in a string path, so the mount
// uses a regex to capture the accionista id into req.params.id.
app.use(
	/^\/api\/accionistas\/([^\/]+)\/acciones/,
	(req, _res, next) => {
		// The sub-router resets req.params, so keep the accionista id on the
		// request for the assign routes.
		(req as { accionistaId?: string }).accionistaId = req.params[0];
		next();
	},
	authMiddleware,
	adminOnly,
	accionesAsignacionRoutes
);

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
