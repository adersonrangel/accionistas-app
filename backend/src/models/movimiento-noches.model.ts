import { Schema, model } from "mongoose";

/**
 * Historial de movimientos de noches de beneficio.
 * Cada registro representa un descuento (uso) o devolución de noches.
 */
const movimientoNochesSchema = new Schema(
	{
		shareholderId: {
			type: Schema.Types.ObjectId,
			ref: "Shareholder",
			required: true,
			index: true,
		},
		tipo: {
			type: String,
			enum: ["descuento", "devolucion"],
			required: true,
		},
		cantidad: {
			type: Number,
			required: true,
			min: [1, "La cantidad debe ser al menos 1"],
			validate: {
				validator: (v: number) => Number.isInteger(v),
				message: "La cantidad debe ser un número entero",
			},
		},
		// Fecha efectiva seleccionada al descontar. Los registros históricos
		// anteriores a este campo usan createdAt para calcular su año.
		fechaDescuento: {
			type: Date,
		},
		motivo: {
			type: String,
			default: "",
			trim: true,
		},
		// Usuario que ejecutó el movimiento (del token de autenticación)
		usuario: {
			type: String,
			default: "",
		},
		// Saldo resultante después del movimiento (para auditoría)
		saldoAnterior: {
			type: Number,
			required: true,
		},
		saldoNuevo: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Índice compuesto para consultas por accionista ordenadas por fecha
movimientoNochesSchema.index({ shareholderId: 1, createdAt: -1 });

export default model("MovimientoNoches", movimientoNochesSchema);
