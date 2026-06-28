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

// API routes
app.use("/api/accionistas", accionistasRoutes);

// Share routes with auth guard
(async () => {
	const { default: authMiddleware } = await import(
		"./middleware/auth.middleware.ts"
	);
	const { default: shareRoutes } = await import("./routes/share.routes.ts");
	app.use(
		"/api/shareholders/:shareholderId/shares",
		authMiddleware,
		shareRoutes,
	);
})();

// Error handler genérico
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
