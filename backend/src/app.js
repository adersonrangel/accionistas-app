const express = require("express");
const cors = require("cors");
const accionistasRoutes = require("./routes/accionistas");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", service: "hotel-accionistas-backend" });
});

// Auth routes
(async () => {
	const { default: authRoutes } = await import("./routes/auth.routes.ts");
	app.use("/api", authRoutes);
})();

// API routes: accionistas module requires an authenticated user
// (any role: admin or normal user).
(async () => {
	const { default: authMiddleware } = await import(
		"./middleware/auth.middleware.ts"
	);
	app.use("/api/accionistas", authMiddleware, accionistasRoutes);
})();

// Acciones routes: admin-only (module fully restricted).
(async () => {
	const { default: authMiddleware } = await import(
		"./middleware/auth.middleware.ts"
	);
	const { default: adminOnly } = await import("./middleware/adminOnly.ts");
	const { default: accionesRoutes } = await import("./routes/acciones.routes.ts");
	app.use(
		"/api/acciones",
		authMiddleware,
		adminOnly,
		accionesRoutes,
	);
})();

// User administration routes: admin-only.
(async () => {
	const { default: authMiddleware } = await import(
		"./middleware/auth.middleware.ts"
	);
	const { default: adminOnly } = await import("./middleware/adminOnly.ts");
	const { default: usersRoutes } = await import("./routes/users.routes.ts");
	app.use("/api/users", authMiddleware, adminOnly, usersRoutes);
})();

// Assignment routes (auth + admin) nested under accionista.
// Express 4 `use()` does not capture :id in a string path, so the mount
// uses a regex to capture the accionista id; the sub-router resets
// req.params, so it is kept on the request for the assign routes.
(async () => {
	const { default: authMiddleware } = await import(
		"./middleware/auth.middleware.ts"
	);
	const { default: adminOnly } = await import("./middleware/adminOnly.ts");
	const { default: accionesAsignacionRoutes } = await import(
		"./routes/acciones-asignacion.routes.ts"
	);
	app.use(
		/^\/api\/accionistas\/([^\/]+)\/acciones/,
		(req, _res, next) => {
			req.accionistaId = req.params[0];
			next();
		},
		authMiddleware,
		adminOnly,
		accionesAsignacionRoutes
	);
})();

// Error handler genérico
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;