import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../../src/app.ts";
import { beforeAll, beforeEach, describe, it, expect } from "vitest";

const COLLECTION = "accionistas";
const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

async function clearAccionistas() {
	await mongoose.connection.db
		.collection(COLLECTION)
		.deleteMany({});
}

async function clearAcciones() {
	await mongoose.connection.db.collection("acciones").deleteMany({});
	await mongoose.connection.db
		.collection("counters")
		.deleteMany({ _id: "accion_code" });
}

const baseAccionista = {
	nombre: "Ana",
	apellido: "Torres",
	dni: "33000111",
	email: "ana.torres@email.com",
	fechaIngreso: "2024-01-10",
	telefono: "+5491100001111",
	direccion: "Calle Falsa 123, CABA",
};

describe("Accionistas endpoints backed by MongoDB", () => {
	let adminToken: string;
	let userToken: string;

	beforeAll(async () => {
		const loginResponse = await request(app)
			.post("/api/login")
			.set("Accept", "application/json")
			.send({ username: "admin", password: "admin" });
		adminToken = loginResponse.body.token;

		userToken = jwt.sign(
			{ username: "normal", role: "user" },
			JWT_SECRET,
			{ expiresIn: "1h" }
		);
	});

	beforeEach(async () => {
		await clearAccionistas();
		await clearAcciones();
	});

	async function crearAccion(percentage: number) {
		const res = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage });
		if (res.statusCode !== 201)
			throw new Error(`crearAccion falló: ${res.statusCode}`);
		return res.body.data as { _id: string; code: string };
	}

	it("persists a created accionista in MongoDB, not only in memory", async () => {
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		expect(response.statusCode).toBe(201);
		expect(response.body.data.porcentajeAcciones).toBe(0);

		const docs = await mongoose.connection.db
			.collection(COLLECTION)
			.find({ email: baseAccionista.email })
			.toArray();
		expect(docs).toHaveLength(1);
		expect(docs[0].nombre).toBe(baseAccionista.nombre);
	});

	it("POST / creates an accionista without porcentajeAcciones in the payload", async () => {
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		expect(response.statusCode).toBe(201);
		expect(response.body.data.porcentajeAcciones).toBe(0);
	});

	it("almacena una identificación con guion (ej. 12313231-6) sin alterar el texto", async () => {
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ ...baseAccionista, dni: "12313231-6" });
		expect(response.statusCode).toBe(201);
		expect(response.body.data.dni).toBe("12313231-6");

		const docs = await mongoose.connection.db
			.collection(COLLECTION)
			.find({ dni: "12313231-6" })
			.toArray();
		expect(docs).toHaveLength(1);
		expect(docs[0].dni).toBe("12313231-6");
	});

	it("POST / ignores a provided porcentajeAcciones (derived field)", async () => {
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ ...baseAccionista, porcentajeAcciones: 20 });
		expect(response.statusCode).toBe(201);
		expect(response.body.data.porcentajeAcciones).toBe(0);
	});

	it("GET / lists accionistas from the database with { data, total }", async () => {
		await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);

		const response = await request(app)
			.get("/api/accionistas")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data).toHaveLength(1);
		expect(response.body.data[0].dni).toBe(baseAccionista.dni);
	});

	it("GET /:id returns 404 when the accionista does not exist", async () => {
		const response = await request(app)
			.get("/api/accionistas/99999")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(404);
		expect(response.body.error).toBe("Accionista no encontrado");
	});

	it("POST / rejects missing required fields with 400 (percentage no longer required)", async () => {
		const { dni, ...incompleto } = baseAccionista;
		const response = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(incompleto);
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBe("Faltan campos requeridos: dni");
	});

	it("PUT /:id updates fields but keeps the original id and ignores percentage", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		const id = created.body.data.id;

		const response = await request(app)
			.put(`/api/accionistas/${id}`)
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ ...baseAccionista, apellido: "Torres Jr", id, porcentajeAcciones: 99 });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.id).toBe(id);
		expect(response.body.data.apellido).toBe("Torres Jr");
		expect(response.body.data.porcentajeAcciones).toBe(0);
	});

	it("DELETE /:id removes the accionista from the database", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		const id = created.body.data.id;

		const del = await request(app)
			.delete(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(del.statusCode).toBe(200);

		const after = await request(app)
			.get(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(after.statusCode).toBe(404);
	});

	it("derives porcentajeAcciones as the sum of assigned acciones", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		const id = created.body.data.id;

		const a1 = await crearAccion(25);
		const a2 = await crearAccion(30);

		const asignar = await request(app)
			.post(`/api/accionistas/${id}/acciones`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ accionIds: [a1._id, a2._id] });
		expect(asignar.statusCode).toBe(200);

		const one = await request(app)
			.get(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(one.statusCode).toBe(200);
		expect(one.body.data.porcentajeAcciones).toBe(55);

		const list = await request(app)
			.get("/api/accionistas")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(list.body.data[0].porcentajeAcciones).toBe(55);
	});

	it("recomputes the derived percentage on unassignment and on accion edit", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		const id = created.body.data.id;

		const a1 = await crearAccion(25);
		const a2 = await crearAccion(30);
		await request(app)
			.post(`/api/accionistas/${id}/acciones`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ accionIds: [a1._id, a2._id] });

		// Desasignar a2 (30) -> queda 25
		const unassign = await request(app)
			.delete(`/api/accionistas/${id}/acciones/${a2._id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(unassign.statusCode).toBe(200);
		const afterUnassign = await request(app)
			.get(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(afterUnassign.statusCode).toBe(200);
		expect(afterUnassign.body.data.porcentajeAcciones).toBe(25);

		// Editar el porcentaje de a1 (25 -> 40) -> total 40
		const editAccion = await request(app)
			.put(`/api/acciones/${a1._id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: 40 });
		expect(editAccion.statusCode).toBe(200);
		const afterEdit = await request(app)
			.get(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(afterEdit.statusCode).toBe(200);
		expect(afterEdit.body.data.porcentajeAcciones).toBe(40);
	});

	it("returns 401 when no auth token is provided", async () => {
		const response = await request(app).get("/api/accionistas");
		expect(response.statusCode).toBe(401);
	});

	it("allows a normal user to read accionistas (any authenticated role)", async () => {
		await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);

		const response = await request(app)
			.get("/api/accionistas")
			.set("Authorization", `Bearer ${userToken}`);
		expect(response.statusCode).toBe(200);
		expect(response.body.total).toBe(1);
	});

	it("denies DELETE /:id for a normal user (403) and keeps the accionista", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		expect(created.statusCode).toBe(201);
		const id = created.body.data.id;

		const response = await request(app)
			.delete(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${userToken}`);
		expect(response.statusCode).toBe(403);
		expect(response.body.error).toBe("Access denied");

		const docs = await mongoose.connection.db
			.collection(COLLECTION)
			.find({ id })
			.toArray();
		expect(docs).toHaveLength(1);
	});

	it("allows an admin to DELETE /:id", async () => {
		const created = await request(app)
			.post("/api/accionistas")
			.set("Accept", "application/json")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(baseAccionista);
		const id = created.body.data.id;

		const response = await request(app)
			.delete(`/api/accionistas/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);

		const docs = await mongoose.connection.db
			.collection(COLLECTION)
			.find({ id })
			.toArray();
		expect(docs).toHaveLength(0);
	});
});