import Accion from "../models/accion.model.ts";
import MovimientoNoches from "../models/movimiento-noches.model.ts";
import accionistaModule from "../models/accionista.js";

const { Accionista } = accionistaModule as {
	Accionista: typeof import("mongoose").Model;
};

export interface MovimientoNoche {
	tipo: string;
	cantidad: number;
	fechaDescuento?: Date;
	createdAt?: Date;
}

/** Calcula el saldo usado únicamente con movimientos del año indicado. */
export function calcularNochesUsadas(
	movimientos: MovimientoNoche[],
	anio: number
): number {
	return movimientos.reduce((saldo, mov) => {
		const fecha = mov.fechaDescuento ?? mov.createdAt;
		if (!fecha || new Date(fecha).getUTCFullYear() !== anio) return saldo;
		if (mov.tipo === "descuento") return saldo + mov.cantidad;
		if (mov.tipo === "devolucion") return saldo - mov.cantidad;
		return saldo;
	}, 0);
}

export type DescuentoNochesResult =
	| { status: "not_found" }
	| { status: "insufficient"; disponibles: number }
	| { status: "ok"; data: ConsultaAccionistaResult };

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
 * Busca un accionista por identificación y calcula sus noches de beneficio.
 * - Noches totales: suma de nochesDeBeneficio de todas sus acciones asignadas
 * - Noches usadas: descuentos menos devoluciones del año en curso
 * - Noches disponibles: totales - usadas; se restablecen cada 1 de enero
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
	}).lean()) as MovimientoNoche[];

	const nochesUsadas = calcularNochesUsadas(
		movimientos,
		new Date().getUTCFullYear()
	);

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

/** Devuelve el historial completo ordenado por fecha efectiva descendente. */
export async function obtenerHistorial(dni: string) {
	const accionista = (await Accionista.findOne({ dni }).lean()) as {
		_id: unknown;
	} | null;
	if (!accionista) return null;

	const movimientos = (await MovimientoNoches.find({
		shareholderId: accionista._id,
	}).lean()) as Array<
		MovimientoNoche & {
			_id: unknown;
			motivo?: string;
			usuario?: string;
		}
	>;

	return movimientos
		.map((mov) => ({
			id: String(mov._id),
			tipo: mov.tipo,
			cantidad: mov.cantidad,
			fecha: mov.fechaDescuento ?? mov.createdAt,
			motivo: mov.motivo ?? "",
			usuario: mov.usuario ?? "",
		}))
		.sort((a, b) => new Date(b.fecha ?? 0).getTime() - new Date(a.fecha ?? 0).getTime());
}

// Serializa validación + escritura por accionista dentro de esta instancia de
// Node. La cola se elimina al quedar vacía y los errores no bloquean al siguiente.
const colasDescuento = new Map<string, Promise<void>>();

async function conDescuentoSerializado<T>(
	shareholderId: string,
	operacion: () => Promise<T>
): Promise<T> {
	const anterior = colasDescuento.get(shareholderId) ?? Promise.resolve();
	let liberar!: () => void;
	const actual = new Promise<void>((resolve) => {
		liberar = resolve;
	});
	const cola = anterior.then(() => actual);
	colasDescuento.set(shareholderId, cola);

	await anterior;
	try {
		return await operacion();
	} finally {
		liberar();
		if (colasDescuento.get(shareholderId) === cola) {
			colasDescuento.delete(shareholderId);
		}
	}
}

/** Registra un descuento usando el saldo del año de la fecha seleccionada. */
export async function descontarNoches(
	dni: string,
	cantidad: number,
	fechaDescuento: Date,
	usuario: string
): Promise<DescuentoNochesResult> {
	const accionista = (await Accionista.findOne({ dni }).lean()) as {
		_id: unknown;
	} | null;
	if (!accionista) return { status: "not_found" };

	return conDescuentoSerializado(String(accionista._id), async () => {
		const acciones = (await Accion.find({ shareholderId: accionista._id }).lean()) as Array<{
			nochesDeBeneficio: number;
		}>;
		const nochesTotales = acciones.reduce(
			(sum, acc) => sum + (acc.nochesDeBeneficio || 0),
			0
		);
		const movimientos = (await MovimientoNoches.find({
			shareholderId: accionista._id,
		}).lean()) as MovimientoNoche[];
		const nochesUsadas = calcularNochesUsadas(
			movimientos,
			fechaDescuento.getUTCFullYear()
		);
		const disponibles = Math.max(0, nochesTotales - nochesUsadas);

		if (cantidad > disponibles) return { status: "insufficient", disponibles };

		await MovimientoNoches.create({
			shareholderId: accionista._id,
			tipo: "descuento",
			cantidad,
			fechaDescuento,
			usuario,
			saldoAnterior: disponibles,
			saldoNuevo: disponibles - cantidad,
		});

		const data = await consultarPorDni(dni);
		return { status: "ok", data: data as ConsultaAccionistaResult };
	});
}
