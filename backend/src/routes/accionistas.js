const express = require("express");
const router = express.Router();
const model = require("../models/accionista");

// GET /api/accionistas - listar todos
router.get("/", (req, res) => {
  res.json({ data: model.findAll(), total: model.findAll().length });
});

// GET /api/accionistas/:id - obtener uno
router.get("/:id", (req, res) => {
  const accionista = model.findById(req.params.id);
  if (!accionista) return res.status(404).json({ error: "Accionista no encontrado" });
  res.json({ data: accionista });
});

// POST /api/accionistas - crear
router.post("/", (req, res) => {
  const camposRequeridos = ["nombre", "apellido", "dni", "email", "porcentajeAcciones"];
  const faltantes = camposRequeridos.filter(c => !req.body[c]);
  if (faltantes.length > 0) {
    return res.status(400).json({ error: `Faltan campos requeridos: ${faltantes.join(", ")}` });
  }
  const nuevo = model.create(req.body);
  res.status(201).json({ data: nuevo, message: "Accionista creado correctamente" });
});

// PUT /api/accionistas/:id - actualizar
router.put("/:id", (req, res) => {
  const actualizado = model.update(req.params.id, req.body);
  if (!actualizado) return res.status(404).json({ error: "Accionista no encontrado" });
  res.json({ data: actualizado, message: "Accionista actualizado correctamente" });
});

// DELETE /api/accionistas/:id - eliminar
router.delete("/:id", (req, res) => {
  const ok = model.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: "Accionista no encontrado" });
  res.json({ message: "Accionista eliminado correctamente" });
});

module.exports = router;
