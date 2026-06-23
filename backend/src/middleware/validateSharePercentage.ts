import type { Request, Response, NextFunction } from "express";
import Shareholder from "../models/shareholder.model";
import Share from "../models/share.model";

const validateSharePercentage = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const { shareholderId, percentage } = req.body;
	if (!shareholderId || !percentage) {
		return res
			.status(400)
			.json({ error: "shareholderId and percentage are required" });
	}

	const shareholder = await Shareholder.findById(shareholderId);
	if (!shareholder)
		return res.status(404).json({ error: "Shareholder not found" });

	// Compute current sum
	const currentShares = await Share.find({ shareholderId });
	const currentTotal = currentShares.reduce((sum, s) => sum + s.percentage, 0);

	if (currentTotal + percentage > 100) {
		return res
			.status(400)
			.json({ error: "Total percentage cannot exceed 100%" });
	}
	next();
};

export default validateSharePercentage;
