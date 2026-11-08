const express = require("express");
const cors = require("cors");
const accionistasRoutes = require("./routes/accionistas");

const app = express();

// Las rutas se registran de forma asíncrona porque los módulos ESM/TypeScript
// se cargan con import(). Cada IIFE añade su promesa a esta lista y
// `app.routesReady` se resuelve cuando todas las rutas están montadas, de modo
// que los consumidores (p. ej. los tests de integración) puedan esperar la
// registración antes de hacer peticiones.
const routeRegistrations = [];

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", service: "hotel-accionistas-backend" });
});

// Auth routes
routeRegistrations.push(
	(async () => {
		const { default: authRoutes } = await import("./routes/auth.routes.ts");
		app.use("/api", authRoutes);
	})()
);

// API routes: accionistas module requires an authenticated user
// (any role: admin or normal user).
routeRegistrations.push(
	(async () => {
		const { default: authMiddleware } = await import(
			"./middleware/auth.middleware.ts"
		);
		app.use("/api/accionistas", authMiddleware, accionistasRoutes);

		// Consulta de accionistas (búsqueda por DNI con noches de beneficio):
		// cualquier usuario autenticado.
		const { default: consultaRoutes } = await import("./routes/consulta.routes.ts");
		app.use("/api/consulta", authMiddleware, consultaRoutes);
	})()
);

// Acciones routes: admin-only (module fully restricted).
routeRegistrations.push(
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
	})()
);

// User administration routes: admin-only.
routeRegistrations.push(
	(async () => {
		const { default: authMiddleware } = await import(
			"./middleware/auth.middleware.ts"
		);
		const { default: adminOnly } = await import("./middleware/adminOnly.ts");
		const { default: usersRoutes } = await import("./routes/users.routes.ts");
		app.use("/api/users", authMiddleware, adminOnly, usersRoutes);
	})()
);

// Assignment routes nested under accionista. GET (ver acciones asignadas)
// permite a cualquier rol autenticado; POST/DELETE (asignar/quitar) son
// admin-only por las guards propias del sub-router.
// Express 4 `use()` does not capture :id in a string path, so the mount
// uses a regex to capture the accionista id; the sub-router resets
// req.params, so it is kept on the request for the assign routes.
routeRegistrations.push(
	(async () => {
		const { default: authMiddleware } = await import(
			"./middleware/auth.middleware.ts"
		);
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
			accionesAsignacionRoutes
		);
	})()
);

// Error handler genérico
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Error interno del servidor" });
});

app.routesReady = Promise.all(routeRegistrations);

module.exports = app;
