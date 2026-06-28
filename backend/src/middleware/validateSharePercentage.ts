import type { Request, Response, NextFunction } from "express";
import Shareholder from "../models/shareholder.model";
import Share from "../models/share.model";

const validateSharePercentage = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const shareholderId = req.params.shareholderId || req.body.shareholderId;
		const { percentage } = req.body;

		if (!shareholderId || percentage === undefined) {
			return res
				.status(400)
				.json({ error: "shareholderId and percentage are required" });
		}

		const shareholder = await Shareholder.findById(shareholderId);
		if (!shareholder) {
			return res.status(404).json({ error: "Shareholder not found" });
		}

		const currentShares = await Share.find({ shareholderId });
		const currentTotal = currentShares.reduce(
			(sum, s) => sum + s.percentage,
			0,
		);

		if (currentTotal + percentage > 100) {
			return res
				.status(422)
				.json({ error: "Total allocation cannot exceed 100%" });
		}
		next();
	} catch (error) {
		return res.status(500).json({ error: "Internal server error" });
	}
};

export default validateSharePercentage;
