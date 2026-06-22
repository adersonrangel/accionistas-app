const express = require("express");
const cors = require("cors");
const accionistasRoutes = require("./routes/accionistas");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hotel-accionistas-backend" });
});

// API routes
app.use("/api/accionistas", accionistasRoutes);

// Error handler genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 API de accionistas disponible en http://localhost:${PORT}/api/accionistas`);
});
