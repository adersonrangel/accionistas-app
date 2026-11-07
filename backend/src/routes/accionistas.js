const express = require("express");
const router = express.Router();
const model = require("../models/accionista");

// GET /api/accionistas - listar todos con paginación
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { docs, total } = await model.findAllPaginado(page, pageSize);
    res.json({ data: docs, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/accionistas/:id - obtener uno
router.get("/:id", async (req, res) => {
  try {
    const accionista = await model.findById(req.params.id);
    if (!accionista) return res.status(404).json({ error: "Accionista no encontrado" });
    res.json({ data: accionista });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/accionistas - crear
router.post("/", async (req, res) => {
  try {
    // porcentajeAcciones no es editable: se deriva de las acciones asignadas.
    const camposRequeridos = ["nombre", "apellido", "dni", "email"];
    const faltantes = camposRequeridos.filter(c => !req.body[c]);
    if (faltantes.length > 0) {
      return res.status(400).json({ error: `Faltan campos requeridos: ${faltantes.join(", ")}` });
    }
    const nuevo = await model.create(req.body);
    res.status(201).json({ data: nuevo, message: "Accionista creado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/accionistas/:id - actualizar
router.put("/:id", async (req, res) => {
  try {
    const actualizado = await model.update(req.params.id, req.body);
    if (!actualizado) return res.status(404).json({ error: "Accionista no encontrado" });
    res.json({ data: actualizado, message: "Accionista actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/accionistas/:id - eliminar (solo admin)
router.delete("/:id", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const ok = await model.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: "Accionista no encontrado" });
    res.json({ message: "Accionista eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
