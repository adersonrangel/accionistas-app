import { Router } from "express";
import { consultarPorDni } from "../services/consulta-accionista.service.ts";

const router = Router();

/**
 * GET /api/consulta/accionista/dni/:dni
 * Busca un accionista por DNI y devuelve su información completa
 * incluyendo noches de beneficio totales, usadas y disponibles.
 * Acceso: cualquier usuario autenticado (admin o normal).
 */
router.get("/accionista/dni/:dni", async (req, res) => {
	try {
		const { dni } = req.params;

		if (!dni || dni.trim().length === 0) {
			return res.status(400).json({ error: "El DNI es requerido" });
		}

		const resultado = await consultarPorDni(dni.trim());

		if (!resultado) {
			return res.status(404).json({
				error: "No se encontró ningún accionista con ese DNI",
			});
		}

		res.json({ data: resultado });
	} catch (err) {
		console.error("Error en consulta por DNI:", err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;
