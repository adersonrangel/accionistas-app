import mongoose from "mongoose";
import Shareholder from "../models/shareholder.model";
import Share from "../models/share.model";

async function migrate() {
	console.log("Starting legacy shares migration...");
	const shareholders = await Shareholder.find();
	let migratedCount = 0;
	for (const s of shareholders) {
		if (s.porcentajeAcciones && (!s.shares || s.shares.length === 0)) {
			const newShare = await Share.create({
				id: `LEGACY-${s._id}`,
				number: "LEGACY-01",
				acquisitionDate: new Date(),
				percentage: s.porcentajeAcciones,
				// Assuming Share schema has shareholderId field (add if needed)
				// shareholderId: s._id
			});
			await Shareholder.findByIdAndUpdate(s._id, {
				$push: { shares: newShare._id },
			});
			migratedCount++;
		}
	}
	console.log(`Migration completed. ${migratedCount} shareholders migrated.`);
}

// Run migration when script executed directly
if (require.main === module) {
	mongoose
		.connect(process.env.MONGO_URI || "mongodb://localhost:27017/accionistas", {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		.then(() => migrate())
		.catch(console.error);
}
