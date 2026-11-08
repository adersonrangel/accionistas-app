import Accion from "../models/accion.model.ts";
import MovimientoNoches from "../models/movimiento-noches.model.ts";
import accionistaModule from "../models/accionista.js";

const { Accionista } = accionistaModule as {
	Accionista: typeof import("mongoose").Model;
};

export interface ConsultaAccionistaResult {
	id: number;
	nombre: string;
	apellido: string;
	dni: string;
	email: string;
	telefono: string;
	direccion: string;
	fechaIngreso: string;
	porcentajeAcciones: number;
	noches: {
		totales: number;
		usadas: number;
		disponibles: number;
	};
	acciones: Array<{
		code: string;
		percentage: number;
		nochesDeBeneficio: number;
	}>;
}

/**
 * Busca un accionista por DNI y calcula sus noches de beneficio.
 * - Noches totales: suma de nochesDeBeneficio de todas sus acciones asignadas
 * - Noches usadas: suma de descuentos menos devoluciones del historial
 * - Noches disponibles: totales - usadas
 */
export async function consultarPorDni(
	dni: string
): Promise<ConsultaAccionistaResult | null> {
	// 1. Buscar accionista por DNI
	const accionista = (await Accionista.findOne({ dni }).lean()) as {
		_id: unknown;
		id: number;
		nombre: string;
		apellido: string;
		dni: string;
		email: string;
		telefono: string;
		direccion: string;
		fechaIngreso: string;
	} | null;

	if (!accionista) return null;

	// 2. Obtener acciones asignadas con sus noches de beneficio
	const acciones = (await Accion.find({
		shareholderId: accionista._id,
	})
		.sort({ code: 1 })
		.lean()) as Array<{
		code: string;
		percentage: number;
		nochesDeBeneficio: number;
	}>;

	// 3. Calcular noches totales (suma de acciones)
	const nochesTotales = acciones.reduce(
		(sum, acc) => sum + (acc.nochesDeBeneficio || 0),
		0
	);

	// 4. Calcular noches usadas desde el historial de movimientos
	const movimientos = (await MovimientoNoches.find({
		shareholderId: accionista._id,
	}).lean()) as Array<{ tipo: string; cantidad: number }>;

	const nochesUsadas = movimientos.reduce((saldo, mov) => {
		if (mov.tipo === "descuento") return saldo + mov.cantidad;
		if (mov.tipo === "devolucion") return saldo - mov.cantidad;
		return saldo;
	}, 0);

	const nochesDisponibles = Math.max(0, nochesTotales - nochesUsadas);

	// 5. Calcular porcentaje total de acciones
	const porcentajeAcciones =
		Math.round(
			acciones.reduce((sum, acc) => sum + (acc.percentage || 0), 0) * 100
		) / 100;

	return {
		id: accionista.id,
		nombre: accionista.nombre,
		apellido: accionista.apellido,
		dni: accionista.dni,
		email: accionista.email,
		telefono: accionista.telefono || "",
		direccion: accionista.direccion || "",
		fechaIngreso: accionista.fechaIngreso || "",
		porcentajeAcciones,
		noches: {
			totales: nochesTotales,
			usadas: nochesUsadas,
			disponibles: nochesDisponibles,
		},
		acciones: acciones.map((acc) => ({
			code: acc.code,
			percentage: acc.percentage,
			nochesDeBeneficio: acc.nochesDeBeneficio || 0,
		})),
	};
}
