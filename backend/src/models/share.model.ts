import { Schema, model } from "mongoose";

const shareSchema = new Schema(
	{
		shareholderId: {
			type: Schema.Types.ObjectId,
			ref: "Shareholder",
			required: true,
		},
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

export default model("Share", shareSchema);
