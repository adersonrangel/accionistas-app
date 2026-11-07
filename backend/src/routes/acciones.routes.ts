import express, { Router } from "express";
import Accion from "../models/accion.model.ts";
import AccionCounter from "../models/counters.model.ts";
import adminOnly from "../middleware/adminOnly.ts";

const router = Router();
const MAX_CODE = 99999;

function isValidPercentage(v: unknown): boolean {
	return (
		typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100
	);
}

function isValidNochesDeBeneficio(v: unknown): boolean {
	return (
		typeof v === "number" &&
		Number.isFinite(v) &&
		Number.isInteger(v) &&
		v >= 0
	);
}

async function nextCode() {
	const updated = await AccionCounter.findOneAndUpdate(
		{ _id: "accion_code" },
		{ $inc: { seq: 1 } },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);
	if (!updated) throw new Error("Counter error");
	if (updated.seq > MAX_CODE) {
		const err: any = new Error("Code limit reached");
		err.status = 409;
		throw err;
	}
	return String(updated.seq).padStart(5, '0');
}

// GET /api/acciones - listar todos con paginación
router.get("/", async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.pageSize) || 10;
		const skip = (page - 1) * pageSize;
		const [acciones, total] = await Promise.all([
			Accion.find().sort({ code: 1 }).skip(skip).limit(pageSize).exec(),
			Accion.countDocuments(),
		]);
		res.json({ data: acciones, total });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/acciones/disponibles - registered but unassigned actions
router.get("/disponibles", async (req, res) => {
	try {
		const acciones = await Accion.find({ shareholderId: null }).sort({
			code: 1,
		});
		res.json({ data: acciones });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/acciones/total - sum of all percentages (auth; before /:id)
router.get("/total", async (req, res) => {
	try {
		const rows = await Accion.aggregate([
			{ $group: { _id: null, total: { $sum: "$percentage" } } },
		]);
		const totalPercentage = Math.round((rows[0]?.total ?? 0) * 100) / 100;
		res.json({ data: { totalPercentage } });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// GET /api/acciones/:id - get one
router.get("/:id", async (req, res) => {
	try {
		const accion = await Accion.findById(req.params.id);
		if (!accion) return res.status(404).json({ error: "Accion not found" });
		res.json({ data: accion });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /api/acciones - create (admin only)
router.post("/", adminOnly, async (req, res) => {
	try {
		const { percentage, nochesDeBeneficio } = req.body ?? {};
		if (!isValidPercentage(percentage)) {
			return res.status(400).json({
				error: "Percentage must be a number between 0 and 100",
			});
		}
		if (nochesDeBeneficio !== undefined && !isValidNochesDeBeneficio(nochesDeBeneficio)) {
			return res.status(400).json({
				error: "Noches de beneficio must be a whole number >= 0",
			});
		}
		const code = await nextCode();
		const newAccion = await Accion.create({ code, percentage, ...(nochesDeBeneficio !== undefined ? { nochesDeBeneficio } : {}) });
		res.status(201).json({ data: newAccion });
	} catch (err: any) {
		if (err.code === 11000 || err.status === 409) {
			return res.status(409).json({ error: "Code limit reached or duplicate code" });
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

// PUT /api/acciones/:id - update code and/or percentage (admin only)
router.put("/:id", adminOnly, async (req, res) => {
	try {
		const { code, percentage, nochesDeBeneficio } = req.body ?? {};

		// Reject other fields
		const otherKeys = Object.keys(req.body ?? {}).filter(
			(k) => k !== "code" && k !== "percentage" && k !== "nochesDeBeneficio" && k !== "_id"
		);
		if (otherKeys.length > 0) {
			return res.status(400).json({
				error: "Only 'code', 'percentage' and 'nochesDeBeneficio' can be edited",
			});
		}

		const hasCode = code !== undefined;
		const hasPercentage = percentage !== undefined;
		const hasNoches = nochesDeBeneficio !== undefined;
		if (!hasCode && !hasPercentage && !hasNoches) {
			return res.status(400).json({
				error: "Provide 'code', 'percentage' and/or 'nochesDeBeneficio'",
			});
		}

		if (hasCode && (!code || !/^\d{5}$/.test(code))) {
			return res.status(400).json({ error: "Code must be exactly 5 digits" });
		}

		if (hasPercentage && !isValidPercentage(percentage)) {
			return res.status(400).json({
				error: "Percentage must be a number between 0 and 100",
			});
		}

		if (hasNoches && !isValidNochesDeBeneficio(nochesDeBeneficio)) {
			return res.status(400).json({
				error: "Noches de beneficio must be a whole number >= 0",
			});
		}

		const existing = await Accion.findById(req.params.id);
		if (!existing) return res.status(404).json({ error: "Accion not found" });

		if (hasCode) {
			const dup = await Accion.findOne({ code, _id: { $ne: req.params.id } });
			if (dup) return res.status(409).json({ error: "Code already in use" });
		}

		const update: { code?: string; percentage?: number; nochesDeBeneficio?: number } = {};
		if (hasCode) update.code = code;
		if (hasPercentage) update.percentage = percentage;
		if (hasNoches) update.nochesDeBeneficio = nochesDeBeneficio;
		const updated = await Accion.findByIdAndUpdate(req.params.id, update, {
			new: true,
			runValidators: false,
		});
		if (!updated) return res.status(404).json({ error: "Accion not found" });
		res.json({ data: updated });
	} catch (err: any) {
		if (err.code === 11000) {
			return res.status(409).json({ error: "Code already in use" });
		}
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /api/acciones/:id (admin only)
router.delete("/:id", adminOnly, async (req, res) => {
	try {
		const deleted = await Accion.findByIdAndDelete(req.params.id);
		if (!deleted) return res.status(404).json({ error: "Accion not found" });
		res.json({ message: "Accion deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;