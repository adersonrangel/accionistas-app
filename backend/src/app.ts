import express from "express";
import cors from "cors";
import accionistasRoutes from "./routes/accionistas.js";
import authRoutes from "./routes/auth.routes.ts";
import authMiddleware from "./middleware/auth.middleware.ts";
import accionesRoutes from "./routes/acciones.routes.ts";
import accionesAsignacionRoutes from "./routes/acciones-asignacion.routes.ts";
import usersRoutes from "./routes/users.routes.ts";
import adminOnly from "./middleware/adminOnly.ts";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", service: "hotel-accionistas-backend" });
});

// Auth routes (login is the single entry point)
app.use("/api", authRoutes);

// API routes: accionistas module requires an authenticated user
// (any role: admin or normal user).
app.use("/api/accionistas", authMiddleware, accionistasRoutes);

// Acciones routes: admin-only (module fully restricted).
app.use("/api/acciones", authMiddleware, adminOnly, accionesRoutes);

// User administration routes: admin-only.
app.use("/api/users", authMiddleware, adminOnly, usersRoutes);

// Assignment routes nested under accionista. GET (ver acciones asignadas)
// permite a cualquier rol autenticado; POST/DELETE (asignar/quitar) son
// admin-only por las guards propias del sub-router.
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
	accionesAsignacionRoutes
);

// Error handler genérico
app.use(
	(
		err: any,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction
	) => {
		console.error(err.stack);
		res.status(500).json({ error: "Error interno del servidor" });
	}
);

export default app;