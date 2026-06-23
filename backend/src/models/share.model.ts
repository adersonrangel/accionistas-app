import { Schema, model } from "mongoose";

const shareSchema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		number: { type: String, required: true },
		acquisitionDate: { type: Date, required: true },
		percentage: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
	},
	{
		timestamps: true,
	},
);

// Ensure percentage validation on update/create
shareSchema.path("percentage").validate(
	(val) => {
		return val >= 0 && val <= 100;
	},
	(msg) => `Percentage must be between 0 and 100`,
);

// Virtual to expose percentage in JSON if needed
shareSchema.set("toJSON", { virtuals: true });

export default model("Share", shareSchema);
