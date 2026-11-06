import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.ts";
import Accion from "../../src/models/accion.model.ts";
import accionistaModule from "../../src/models/accionista.js";

const { Accionista } = accionistaModule as {
	Accionista: typeof import("mongoose").Model;
};
import Counter from "../../src/models/counters.model.ts";
import { beforeAll, beforeEach, describe, it, expect } from "vitest";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

describe("Asignacion de acciones a accionistas", () => {
	let adminToken: string;
	let nonAdminToken: string;
	let seq = 0;

	beforeAll(async () => {
		const loginResponse = await request(app)
			.post("/api/login")
			.set("Accept", "application/json")
			.send({ username: "admin", password: "admin" });
		adminToken = loginResponse.body.token;

		nonAdminToken = jwt.sign(
			{ username: "user", role: "user" },
			JWT_SECRET,
			{ expiresIn: "1h" }
		);
	});

	beforeEach(async () => {
		await Accionista.deleteMany({});
		await Accion.deleteMany({});
		await Counter.deleteMany({ _id: "accion_code" });
	});

	async function crearAccionista(nombre: string) {
		const doc = await (Accionista as unknown as {
			create: (doc: Record<string, unknown>) => Promise<{
				_id: unknown;
				id: number;
			}>;
		}).create({
			id: ++seq,
			nombre,
			apellido: "Test",
			dni: `30${Math.floor(Math.random() * 1e6)}`,
			email: `${nombre.toLowerCase()}@test.com`,
		});
		return doc;
	}

	async function crearAccion(code: string) {
		const doc = await Accion.create({ code });
		return doc;
	}

	describe("POST /api/accionistas/:id/acciones", () => {
		it("asigna 1 o varias acciones registradas a un accionista (200)", async () => {
			const acc = await crearAccionista("Juan");
			const a1 = await crearAccion("00001");
			const a2 = await crearAccion("00002");

			const res = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id, a2._id] });

			expect(res.status).toBe(200);
			expect(res.body.skipped).toEqual([]);
			expect(res.body.data).toHaveLength(2);

			const desdeBd = await Accion.findById(a1._id);
			expect(desdeBd?.shareholderId).toEqual(acc._id);
		});

		it("es idempotente: reasignar al mismo accionista no duplica (200, skipped)", async () => {
			const acc = await crearAccionista("Juan");
			const a1 = await crearAccion("00001");

			const primera = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });
			expect(primera.status).toBe(200);

			const segunda = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });
			expect(segunda.status).toBe(200);
			expect(segunda.body.skipped).toEqual([a1._id]);

			const asignadas = await Accion.find({ shareholderId: acc._id });
			expect(asignadas).toHaveLength(1);
		});

		it("409: accion ya asignada a OTRO accionista, sin cambios (409)", async () => {
			const accA = await crearAccionista("Juan");
			const accB = await crearAccionista("Maria");
			const a1 = await crearAccion("00001");
			const a2 = await crearAccion("00002");

			await request(app)
				.post(`/api/accionistas/${accA.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });

			const res = await request(app)
				.post(`/api/accionistas/${accB.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a2._id, a1._id] });

			expect(res.status).toBe(409);
			expect(res.body.error).toContain("00001");
			expect(res.body.error).toContain("otro accionista");

			// Rechazo atómico: a2 no debe haberse asignado a B
			const a2DesdeBd = await Accion.findById(a2._id);
			expect(a2DesdeBd?.shareholderId).toBeNull();
			const deB = await Accion.find({ shareholderId: accB._id });
			expect(deB).toHaveLength(0);
		});

		it("404: alguna accion no existe (404), sin cambios", async () => {
			const acc = await crearAccionista("Juan");
			const a1 = await crearAccion("00001");
			const inexistente = "66e5f0d0e1b6c4a3f5b0f8e1";

			const res = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id, inexistente] });

			expect(res.status).toBe(404);
			expect(res.body.error).toContain("Accion no encontrada");

			const a1DesdeBd = await Accion.findById(a1._id);
			expect(a1DesdeBd?.shareholderId).toBeNull();
		});

		it("400: accionIds ausente o vacia", async () => {
			const acc = await crearAccionista("Juan");

			const sinBody = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({});
			expect(sinBody.status).toBe(400);

			const vacio = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [] });
			expect(vacio.status).toBe(400);
		});

		it("404: accionista no existe", async () => {
			const a1 = await crearAccion("00001");
			const res = await request(app)
				.post("/api/accionistas/999999/acciones")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });
			expect(res.status).toBe(404);
			expect(res.body.error).toContain("Accionista no encontrado");
		});

		it("401 sin token y 403 con rol no-admin", async () => {
			const acc = await crearAccionista("Juan");
			const a1 = await crearAccion("00001");

			const sinToken = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.send({ accionIds: [a1._id] });
			expect(sinToken.status).toBe(401);

			const noAdmin = await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${nonAdminToken}`)
				.send({ accionIds: [a1._id] });
			expect(noAdmin.status).toBe(403);
		});
	});

	describe("GET /api/accionistas/:id/acciones", () => {
		it("lista solo las acciones asignadas al accionista", async () => {
			const acc = await crearAccionista("Juan");
			const otro = await crearAccionista("Maria");
			const a1 = await crearAccion("00001");
			const a2 = await crearAccion("00002");
			const a3 = await crearAccion("00003");

			await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id, a3._id] });
			await request(app)
				.post(`/api/accionistas/${otro.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a2._id] });

			const res = await request(app)
				.get(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(2);
			const codes = res.body.data.map((a: any) => a.code).sort();
			expect(codes).toEqual(["00001", "00003"]);
		});

		it("404 accionista inexistente, 401 sin token, 403 no-admin", async () => {
			const acc = await crearAccionista("Juan");

			const notFound = await request(app)
				.get("/api/accionistas/999999/acciones")
				.set("Authorization", `Bearer ${adminToken}`);
			expect(notFound.status).toBe(404);

			const sinToken = await request(app)
				.get(`/api/accionistas/${acc.id}/acciones`);
			expect(sinToken.status).toBe(401);

			const noAdmin = await request(app)
				.get(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${nonAdminToken}`);
			expect(noAdmin.status).toBe(403);
		});
	});

	describe("DELETE /api/accionistas/:id/acciones/:accionId", () => {
		it("quita la accion (shareholderId=null) y puede reasignarse a otro", async () => {
			const accA = await crearAccionista("Juan");
			const accB = await crearAccionista("Maria");
			const a1 = await crearAccion("00001");

			await request(app)
				.post(`/api/accionistas/${accA.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });

			const res = await request(app)
				.delete(`/api/accionistas/${accA.id}/acciones/${a1._id}`)
				.set("Authorization", `Bearer ${adminToken}`);
			expect(res.status).toBe(200);

			const desdeBd = await Accion.findById(a1._id);
			expect(desdeBd?.shareholderId).toBeNull();

			// Reasignable a otro accionista
			const reasignar = await request(app)
				.post(`/api/accionistas/${accB.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });
			expect(reasignar.status).toBe(200);
		});

		it("409: la accion no pertenece a este accionista", async () => {
			const accA = await crearAccionista("Juan");
			const accB = await crearAccionista("Maria");
			const a1 = await crearAccion("00001");

			await request(app)
				.post(`/api/accionistas/${accA.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });

			const res = await request(app)
				.delete(`/api/accionistas/${accB.id}/acciones/${a1._id}`)
				.set("Authorization", `Bearer ${adminToken}`);
			expect(res.status).toBe(409);
			expect(res.body.error).toContain("no pertenece a este accionista");

			// Sigue asignada a A
			const desdeBd = await Accion.findById(a1._id);
			expect(desdeBd?.shareholderId).toEqual(accA._id);
		});

		it("404: accion no existe", async () => {
			const acc = await crearAccionista("Juan");
			const res = await request(app)
				.delete(
					`/api/accionistas/${acc.id}/acciones/66e5f0d0e1b6c4a3f5b0f8e2`
				)
				.set("Authorization", `Bearer ${adminToken}`);
			expect(res.status).toBe(404);
			expect(res.body.error).toContain("Accion no encontrada");
		});
	});

	describe("GET /api/acciones/disponibles", () => {
		it("lista acciones registradas SIN asignar (auth, no exige admin)", async () => {
			const acc = await crearAccionista("Juan");
			const a1 = await crearAccion("00001");
			const a2 = await crearAccion("00002");
			const a3 = await crearAccion("00003");

			await request(app)
				.post(`/api/accionistas/${acc.id}/acciones`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ accionIds: [a1._id] });

			const res = await request(app)
				.get("/api/acciones/disponibles")
				.set("Authorization", `Bearer ${nonAdminToken}`);

			expect(res.status).toBe(200);
			const codes = res.body.data
				.map((a: any) => a.code)
				.sort();
			expect(codes).toEqual(["00002", "00003"]);
		});
	});
});
