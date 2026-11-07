import { Schema, model } from "mongoose";
import crypto from "crypto";

const accionSchema = new Schema(
	{
		_id: {
			type: String,
			default: () => crypto.randomUUID(),
		},
		code: {
			type: String,
			required: true,
			unique: true,
			match: [/^\d{5}$/, "Code must be exactly 5 digits"],
		},
		percentage: {
			type: Number,
			required: true,
			min: [0, "Percentage must be >= 0"],
			max: [100, "Percentage must be <= 100"],
		},
		shareholderId: {
			type: Schema.Types.ObjectId,
			ref: "Shareholder",
			default: null,
		},
		nochesDeBeneficio: {
			type: Number,
			default: 0,
			min: [0, "Noches de beneficio must be >= 0"],
			validate: {
				validator: (v: number) => Number.isInteger(v),
				message: "Noches de beneficio must be a whole number",
			},
		},
	},
	{
		timestamps: true,
	}
);

export default model("Accion", accionSchema);