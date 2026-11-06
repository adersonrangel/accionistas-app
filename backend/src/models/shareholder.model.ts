import { Schema, model } from "mongoose";

const shareholderSchema = new Schema(
	{
		nombre: { type: String, required: true },
		apellido: { type: String, required: true },
		dni: { type: String, required: true },
		email: { type: String, required: true },
		shares: [{ type: String, ref: "Accion" }],
	},
	{
		timestamps: true,
	},
);

shareholderSchema.set("toJSON", { virtuals: true });

export default model("Shareholder", shareholderSchema);