import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.ts";
import Accion from "../../src/models/accion.model.ts";
import Counter from "../../src/models/counters.model.ts";
import { beforeAll, beforeEach, describe, it, expect } from "vitest";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

describe("Acciones Endpoints", () => {
	let adminToken: string;
	let nonAdminToken: string;

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
		await Accion.deleteMany({});
		await Counter.deleteMany({ _id: "accion_code" });
	});

	it("GET /api/acciones returns 401 without token", async () => {
		const response = await request(app).get("/api/acciones");
		expect(response.statusCode).toBe(401);
	});

	it("GET /api/acciones returns 200 with admin token", async () => {
		const response = await request(app)
			.get("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);
		expect(response.body.data).toEqual([]);
	});

	it("POST /api/acciones creates action with auto-generated code 00001", async () => {
		const response = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({});
		expect(response.statusCode).toBe(201);
		expect(response.body.data.code).toBe("00001");
		expect(response.body.data._id).toBeDefined();
		expect(typeof response.body.data._id).toBe("string");
	});

	it("POST /api/acciones creates next code 00002", async () => {
		await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({});
		const response = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({});
		expect(response.statusCode).toBe(201);
		expect(response.body.data.code).toBe("00002");
	});

	it("POST /api/acciones returns 403 for non-admin", async () => {
		const response = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${nonAdminToken}`)
			.send({});
		expect(response.statusCode).toBe(403);
	});

	it("PUT /api/acciones/:id updates only code", async () => {
		const createRes = await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({});
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00099" });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.code).toBe("00099");
	});

	it("PUT /api/acciones/:id rejects other fields", async () => {
		const createRes = await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({});
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00098", name: "Hack" });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects bad format", async () => {
		const createRes = await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({});
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "123" });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects duplicate code", async () => {
		await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({}); // 00001
		const createRes = await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({}); // 00002
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00001" });
		expect(response.statusCode).toBe(409);
	});

	it("DELETE /api/acciones/:id deletes action", async () => {
		const createRes = await request(app).post("/api/acciones").set("Authorization", `Bearer ${adminToken}`).send({});
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.delete(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);
		
		const getRes = await request(app)
			.get(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`);
		expect(getRes.statusCode).toBe(404);
	});
});