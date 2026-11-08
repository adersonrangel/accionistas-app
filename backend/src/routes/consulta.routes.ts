import { Router } from "express";
import {
	consultarPorDni,
	descontarNoches,
	obtenerHistorial,
} from "../services/consulta-accionista.service.ts";

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
			return res.status(400).json({ error: "La identificación es requerida" });
		}

		const resultado = await consultarPorDni(dni.trim());

		if (!resultado) {
			return res.status(404).json({
				error: "No se encontró ningún accionista con esa identificación",
			});
		}

		res.json({ data: resultado });
	} catch (err) {
		console.error("Error en consulta por DNI:", err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

/**
 * GET /api/consulta/accionista/dni/:dni/historial
 * Devuelve todos los movimientos con su fecha efectiva y noches.
 * Acceso: cualquier usuario autenticado.
 */
router.get("/accionista/dni/:dni/historial", async (req, res) => {
	try {
		const historial = await obtenerHistorial(req.params.dni.trim());
		if (!historial) {
			return res.status(404).json({
				error: "No se encontró ningún accionista con esa identificación",
			});
		}
		res.json({ data: historial });
	} catch (err) {
		console.error("Error al obtener el historial de noches:", err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

/**
 * POST /api/consulta/accionista/dni/:dni/descuento
 * Descuenta noches en la fecha seleccionada y devuelve el saldo actualizado.
 * Acceso: cualquier usuario autenticado.
 */
router.post("/accionista/dni/:dni/descuento", async (req, res) => {
	try {
		const dni = req.params.dni.trim();
		const { cantidad, fecha } = req.body ?? {};
		if (!Number.isInteger(cantidad) || cantidad < 1) {
			return res.status(400).json({
				error: "La cantidad debe ser un número entero mayor o igual a 1",
			});
		}

		const fechaDescuento = new Date(fecha);
		if (!fecha || Number.isNaN(fechaDescuento.getTime())) {
			return res.status(400).json({ error: "La fecha de descuento es inválida" });
		}

		const resultado = await descontarNoches(
			dni,
			cantidad,
			fechaDescuento,
			req.user?.username ?? ""
		);
		if (resultado.status === "not_found") {
			return res.status(404).json({
				error: "No se encontró ningún accionista con esa identificación",
			});
		}
		if (resultado.status === "insufficient") {
			return res.status(400).json({
				error: "No hay noches suficientes disponibles",
				disponibles: resultado.disponibles,
			});
		}

		res.status(201).json({
			data: resultado.data,
			message: "Descuento registrado correctamente",
		});
	} catch (err) {
		console.error("Error al descontar noches:", err);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;
