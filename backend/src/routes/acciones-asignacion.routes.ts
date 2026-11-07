import { Router } from "express";
import Accion from "../models/accion.model.ts";
import accionistaModule from "../models/accionista.js";

const { Accionista } = accionistaModule as {
	Accionista: typeof import("mongoose").Model;
};

// Montado en /api/accionistas/:id/acciones tras authMiddleware (cualquier rol).
// GET (ver acciones asignadas) es para todo usuario autenticado; POST/DELETE
// (asignar/quitar) exigen rol admin, como exige la política del sistema.
// La URL usa el campo numérico `id` de Accionista; se guarda su `_id` (ObjectId)
// en Accion.shareholderId.
const router = Router();

function accionistaIdFrom(req: import("express").Request): string {
	return (req as { accionistaId?: string }).accionistaId ?? "";
}

function onlyAdmin(
	req: import("express").Request,
	res: import("express").Response,
	next: import("express").NextFunction
) {
	const user = req.user as { role?: string } | undefined;
	if (user?.role !== "admin") {
		return res.status(403).json({ error: "Access denied" });
	}
	next();
}

async function findAccionistaPorId(
	id: string
): Promise<{ _id: unknown; nombre: string } | null> {
	if (!/^\d+$/.test(id)) return null;
	return (await Accionista.findOne({ id: Number(id) }).lean()) as
		| { _id: unknown; nombre: string }
		| null;
}

// GET /api/accionistas/:id/acciones - listar acciones asignadas
router.get("/", async (req, res) => {
	try {
		const accionista = await findAccionistaPorId(accionistaIdFrom(req));
		if (!accionista)
			return res
				.status(404)
				.json({ error: "Accionista no encontrado" });
		const acciones = await Accion.find({
			shareholderId: accionista._id,
		}).sort({ code: 1 });
		res.json({ data: acciones });
	} catch (err) {
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// POST /api/accionistas/:id/acciones - asignar 1 o varias acciones (lote atómico, solo admin)
router.post("/", onlyAdmin, async (req, res) => {
	try {
		const { accionIds } = req.body || {};
		const accionistaId = accionistaIdFrom(req);
		if (
			!Array.isArray(accionIds) ||
			accionIds.length === 0 ||
			accionIds.some((x: unknown) => typeof x !== "string")
		) {
			return res.status(400).json({
				error: "accionIds es requerido: array de ids de acciones",
			});
		}

		const accionista = await findAccionistaPorId(accionistaId);
		if (!accionista)
			return res
				.status(404)
				.json({ error: "Accionista no encontrado" });

		const idsUnicos = Array.from(new Set(accionIds as string[]));
		const acciones = await Accion.find({ _id: { $in: idsUnicos } }).lean();
		if (acciones.length !== idsUnicos.length) {
			return res
				.status(404)
				.json({ error: "Accion no encontrada" });
		}

		// Validación de duplicado: asignada a OTRO accionista -> 409,
		// asignada al MISMO -> idempotente (skipped).
		let skipped: string[] = [];
		const porAsignar: { _id: string }[] = [];
		for (const acc of acciones as { _id: string; shareholderId: unknown }[]) {
			if (String(acc.shareholderId) === String(accionista._id)) {
				skipped.push(acc._id);
			} else if (acc.shareholderId !== null) {
				const conCode = (
					acciones as { _id: string; code: string }[]
				).find((a) => a._id === acc._id);
				return res.status(409).json({
					error: `La acción ${conCode?.code} ya está asignada a otro accionista`,
				});
			} else {
				porAsignar.push({ _id: acc._id });
			}
		}

		if (porAsignar.length > 0) {
			await Accion.updateMany(
				{
					_id: { $in: porAsignar.map((a) => a._id) },
					shareholderId: null,
				},
				{ $set: { shareholderId: accionista._id } }
			);
		}

		const asignadas =
			porAsignar.length > 0
				? await Accion.find({
						_id: { $in: porAsignar.map((a) => a._id) },
				  }).sort({ code: 1 })
				: [];
		res.json({ data: asignadas, skipped });
	} catch (err) {
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// DELETE /api/accionistas/:id/acciones/:accionId - desasignar (solo admin)
router.delete("/:accionId", onlyAdmin, async (req, res) => {
	try {
		const accionista = await findAccionistaPorId(accionistaIdFrom(req));
		if (!accionista)
			return res
				.status(404)
				.json({ error: "Accionista no encontrado" });

		const accion = await Accion.findById(req.params.accionId);
		if (!accion)
			return res.status(404).json({ error: "Accion no encontrada" });
		if (
			!accion.shareholderId ||
			String(accion.shareholderId) !== String(accionista._id)
		) {
			return res
				.status(409)
				.json({ error: "La accion no pertenece a este accionista" });
		}

		(accion as unknown as { shareholderId: unknown }).shareholderId = null;
		await accion.save();
		res.json({ message: "Accion desasignada correctamente" });
	} catch (err) {
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;
