import express, { Router } from "express";
import Share from "../models/share.model";
import adminOnly from "../middleware/adminOnly";
import validateSharePercentage from "../middleware/validateSharePercentage";

const router = Router({ mergeParams: true });

// List all shares
router.get("/", async (req, res) => {
	const shares = await Share.find();
	res.json({ data: shares });
});

// Get single share
router.get("/:id", async (req, res) => {
	const share = await Share.findById(req.params.id);
	if (!share) return res.status(404).json({ error: "Share not found" });
	res.json({ data: share });
});

// Create share (admin only + validation)
router.post("/", adminOnly, validateSharePercentage, async (req, res) => {
	try {
		const newShare = new Share({
			...req.body,
			shareholderId: req.params.shareholderId,
		});
		await newShare.save();
		res.status(201).json({ data: newShare });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Update share (admin only + validation)
router.put("/:id", adminOnly, validateSharePercentage, async (req, res) => {
	const updated = await Share.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	if (!updated) return res.status(404).json({ error: "Share not found" });
	res.json({ data: updated });
});

// Delete share (admin only)
router.delete("/:id", adminOnly, async (req, res) => {
	const del = await Share.findByIdAndDelete(req.params.id);
	if (!del) return res.status(404).json({ error: "Share not found" });
	res.json({ message: "Share deleted" });
});

export default router;
