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
		// Store legacy percentage for backward compatibility; mark as read-only
		porcentajeAcciones: { type: Number },
		// Array of references to Share documents
		shares: [{ type: Schema.Types.ObjectId, ref: "Share" }],
		// Virtual field to compute total percentage (sum of shares percentages)
		totalPercentage: { type: Number, readOnly: true },
	},
	{
		timestamps: true,
	},
);

// Virtual getter for totalPercentage
shareholderSchema.virtual("totalPercentage").get(function () {
	// Compute sum of percentages of all referenced shares
	// For performance, use Share model
	return this.shares.reduce((sum, shareId) => {
		const share = Share.findByIdSync(shareId);
		return sum + (share?.percentage ?? 0);
	}, 0);
});

// Optional: Keep legacy porcentajeAcciones in sync automatically before save
shareholderSchema.pre("save", function (next) {
	// If shares were added/removed, ensure we have latest total
	if (this.isModified("shares")) {
		this.porcentajeAcciones = this.totalPercentage ?? 0;
	}
	next();
});

// ToJSON include virtuals (make totalPercentage part of serialized object)
shareholderSchema.set("toJSON", { virtuals: true });

export default model("Shareholder", shareholderSchema);
