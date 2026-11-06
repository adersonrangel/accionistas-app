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
		shareholderId: {
			type: Schema.Types.ObjectId,
			ref: "Shareholder",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

export default model("Accion", accionSchema);