import { Schema, model } from "mongoose";

// Define Share schema (already created in share.model.ts)
// Reference it here for building Shareholder schema
import Share from "./share.model";

const shareholderSchema = new Schema(
	{
		nombre: { type: String, required: true },
		apellido: { type: String, required: true },
		dni: { type: String, required: true },
		email: { type: String, required: true },
		porcentajeAcciones: { type: Number },
		shares: [{ type: Schema.Types.ObjectId, ref: "Share" }],
		totalPercentage: { type: Number },
	},
	{
		timestamps: true,
	},
);

shareholderSchema.set("toJSON", { virtuals: true });

export default model("Shareholder", shareholderSchema);
