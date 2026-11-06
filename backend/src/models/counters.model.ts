import { Schema, model } from "mongoose";

const counterSchema = new Schema(
	{
		_id: {
			type: String,
			default: "accion_code",
		},
		seq: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

export default model("AccionCounter", counterSchema);