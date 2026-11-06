import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.ts";

const COLLECTION = "accionistas";

async function clearAccionistas() {
	await mongoose.connection.db
		.collection(COLLECTION)
		.deleteMany({});
}

const baseAccionista = {
	nombre: "Ana",
	apellido: "Torres",
	dni: "33000111",
	email: "ana.torres@email.com",
	porcentajeAcciones: 20,
	fechaIngreso: "2024-01-10",
	telefono: "+5491100001111",
	direccion: "Calle Falsa 123, CABA",
};

describe("Accionistas endpoints backed by MongoDB", () => {
	beforeEach(async () => {
		await clearAccionistas();
	});

	it("persists a created accionista in MongoDB, not only in memory", async () => {
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.send(baseAccionista);
		expect(response.statusCode).toBe(201);

		const docs = await mongoose.connection.db
			.collection(COLLECTION)
			.find({ email: baseAccionista.email })
			.toArray();
		expect(docs).toHaveLength(1);
		expect(docs[0].nombre).toBe(baseAccionista.nombre);
	});

	it("GET / lists accionistas from the database with { data, total }", async () => {
		await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.send(baseAccionista);

		const response = await request(app).get("/api/accionistas");
		expect(response.statusCode).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data).toHaveLength(1);
		expect(response.body.data[0].dni).toBe(baseAccionista.dni);
	});

	it("GET /:id returns 404 when the accionista does not exist", async () => {
		const response = await request(app).get("/api/accionistas/99999");
		expect(response.statusCode).toBe(404);
		expect(response.body.error).toBe("Accionista no encontrado");
	});

	it("POST / rejects missing required fields with 400", async () => {
		const { dni, ...incompleto } = baseAccionista;
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.send(incompleto);
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBe("Faltan campos requeridos: dni");
	});

	it("PUT /:id updates fields but keeps the original id", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.send(baseAccionista);
		const id = created.body.data.id;

		const response = await request(app)
			.put(`/api/accionistas/${id}`)
			.set("Accept", "application/json")
			.send({ ...baseAccionista, apellido: "Torres Jr", id });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.id).toBe(id);
		expect(response.body.data.apellido).toBe("Torres Jr");
	});

	it("DELETE /:id removes the accionista from the database", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.send(baseAccionista);
		const id = created.body.data.id;

		const del = await request(app).delete(`/api/accionistas/${id}`);
		expect(del.statusCode).toBe(200);

		const after = await request(app).get(`/api/accionistas/${id}`);
		expect(after.statusCode).toBe(404);
	});
});
