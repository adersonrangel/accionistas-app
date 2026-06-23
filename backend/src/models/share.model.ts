import { Schema, model } from "mongoose";

const ShareSchema = new Schema({
	id: { type: String, required: true, unique: true },
	number: { type: String, required: true },
	acquisitionDate: { type: Date, required: true },
	percentage: {
		type: Number,
		required: true,
		min: 0.0,
		max: 100.0,
	},
});

// Validate percentage range
ShareSchema.path("percentage").validate((val) => {
	return val >= 0 && val <= 100;
}, "Percentage must be between 0 and 100");

export default model("Share", ShareSchema);
