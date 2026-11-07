const { Schema, model, models } = require("mongoose");

const accionistaSchema = new Schema(
	{
		id: { type: Number, required: true, unique: true },
		nombre: { type: String, default: "" },
		apellido: { type: String, default: "" },
		dni: { type: String, default: "" },
		email: { type: String, default: "" },
		porcentajeAcciones: { type: Number, default: 0 },
		fechaIngreso: { type: String, default: "" },
		telefono: { type: String, default: "" },
		direccion: { type: String, default: "" },
	},
	{ timestamps: false },
);

const Counter =
	models.Counter ||
	model("Counter", new Schema({ _id: String, seq: { type: Number, default: 0 } }));

const Accionista =
	models.Accionista || model("Accionista", accionistaSchema);

// Autoincremento atómico (evita ids duplicados bajo concurrencia).
async function nextId() {
	const counter = await Counter.findOneAndUpdate(
		{ _id: "accionista_seq" },
		{ $inc: { seq: 1 } },
		{ returnDocument: "after", upsert: true },
	);
	return counter.seq;
}

function toPublic(doc) {
	return {
		id: doc.id,
		nombre: doc.nombre,
		apellido: doc.apellido,
		dni: doc.dni,
		email: doc.email,
		porcentajeAcciones: doc.porcentajeAcciones,
		fechaIngreso: doc.fechaIngreso,
		telefono: doc.telefono,
		direccion: doc.direccion,
	};
}

const CREADOS = ["nombre", "apellido", "dni", "email", "fechaIngreso", "telefono", "direccion"];

// Suma de porcentajes de las acciones asignadas, por _id (ObjectId) del
// accionista. Es la fuente del campo porcentajeAcciones derivado.
async function sumasPorAccionista() {
	// Modelo ya registrado sobre la instancia compartida de mongoose (lo
	// compila el módulo de acciones al arrancar la app); el import de
	// respaldo solo cubre arranques donde aún no cargó.
	const Accion = models.Accion || (await import("./accion.model.ts")).default;
	const rows = await Accion.aggregate([
		{ $match: { shareholderId: { $ne: null } } },
		{ $group: { _id: "$shareholderId", total: { $sum: "$percentage" } } },
	]);
	const mapa = new Map();
	for (const row of rows) {
		mapa.set(String(row._id), Math.round((row.total ?? 0) * 100) / 100);
	}
	return mapa;
}

// Sobrescribe porcentajeAcciones con la suma de sus acciones asignadas.
function conPorcentajeDerivado(doc, mapa) {
	doc.porcentajeAcciones = mapa.get(String(doc._id)) ?? 0;
	return doc;
}

async function findAll() {
	const docs = await Accionista.find().sort({ id: 1 }).lean();
	const mapa = await sumasPorAccionista();
	return docs.map((d) => toPublic(conPorcentajeDerivado(d, mapa)));
}

// Listado paginado para la route GET /: mantiene la forma raw del doc
// (incluido _id) pero con el porcentaje derivado aplicado.
async function findAllPaginado(page, pageSize) {
	const skip = (page - 1) * pageSize;
	const [docs, total] = await Promise.all([
		Accionista.find().sort({ id: 1 }).skip(skip).limit(pageSize).lean(),
		Accionista.countDocuments(),
	]);
	const mapa = await sumasPorAccionista();
	return { docs: docs.map((d) => conPorcentajeDerivado(d, mapa)), total };
}

async function findById(id) {
	const doc = await Accionista.findOne({ id: Number(id) }).lean();
	if (!doc) return null;
	const mapa = await sumasPorAccionista();
	return toPublic(conPorcentajeDerivado(doc, mapa));
}

async function create(data) {
	const id = await nextId();
	const doc = await Accionista.create({
		id,
		nombre: data.nombre || "",
		apellido: data.apellido || "",
		dni: data.dni || "",
		email: data.email || "",
		// porcentajeAcciones es derivado: no se acepta del input.
		fechaIngreso: data.fechaIngreso || new Date().toISOString().split("T")[0],
		telefono: data.telefono || "",
		direccion: data.direccion || "",
	});
	const mapa = await sumasPorAccionista();
	return toPublic(conPorcentajeDerivado(doc, mapa));
}

async function update(id, data) {
	const set = {};
	for (const field of CREADOS) {
		if (data[field] !== undefined) set[field] = data[field];
	}
	const doc = await Accionista.findOneAndUpdate(
		{ id: Number(id) },
		{ $set: set },
		{ returnDocument: "after" },
	);
	if (!doc) return null;
	const mapa = await sumasPorAccionista();
	return toPublic(conPorcentajeDerivado(doc, mapa));
}

async function remove(id) {
	const doc = await Accionista.findOneAndDelete({ id: Number(id) });
	return !!doc;
}

// Siembra idempotente: solo si la colección está vacía (preserva el demo
// inicial que antes vivía en el array en memoria).
async function seedIfEmpty() {
	const count = await Accionista.countDocuments();
	if (count > 0) return { seeded: false };
	const demo = [
		{ id: 1, nombre: "Juan", apellido: "Pérez", dni: "30111222", email: "juan.perez@email.com", porcentajeAcciones: 25.5, fechaIngreso: "2020-03-15", telefono: "+5491112345678", direccion: "Av. Libertador 1000, Buenos Aires" },
		{ id: 2, nombre: "María", apellido: "González", dni: "28222333", email: "maria.gonzalez@email.com", porcentajeAcciones: 15.0, fechaIngreso: "2021-01-10", telefono: "+5491198765432", direccion: "Calle Florida 500, Buenos Aires" },
		{ id: 3, nombre: "Carlos", apellido: "Rodríguez", dni: "35444555", email: "carlos.rodriguez@email.com", porcentajeAcciones: 10.0, fechaIngreso: "2022-06-20", telefono: "+5491133322211", direccion: "Av. Corrientes 800, Buenos Aires" },
	];
	await Accionista.insertMany(demo);
	await Counter.updateOne({ _id: "accionista_seq" }, { $set: { seq: demo.length } }, { upsert: true });
	return { seeded: true, count: demo.length };
}

module.exports = { Accionista, findAll, findAllPaginado, findById, create, update, remove, seedIfEmpty };
