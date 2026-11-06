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

const CREADOS = ["nombre", "apellido", "dni", "email", "porcentajeAcciones", "fechaIngreso", "telefono", "direccion"];

async function findAll() {
	const docs = await Accionista.find().sort({ id: 1 }).lean();
	return docs.map(toPublic);
}

async function findById(id) {
	const doc = await Accionista.findOne({ id: Number(id) }).lean();
	return doc ? toPublic(doc) : null;
}

async function create(data) {
	const id = await nextId();
	const doc = await Accionista.create({
		id,
		nombre: data.nombre || "",
		apellido: data.apellido || "",
		dni: data.dni || "",
		email: data.email || "",
		porcentajeAcciones: Number(data.porcentajeAcciones) || 0,
		fechaIngreso: data.fechaIngreso || new Date().toISOString().split("T")[0],
		telefono: data.telefono || "",
		direccion: data.direccion || "",
	});
	return toPublic(doc);
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
	return doc ? toPublic(doc) : null;
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

module.exports = { Accionista, findAll, findById, create, update, remove, seedIfEmpty };
