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

	async function crear(percentage: unknown = null, noches: unknown = 3) {
		const body: any = percentage === null ? {} : { percentage };
		if (noches !== null) body.nochesDeBeneficio = noches;
		return request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(body);
	}

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

	it("POST /api/acciones creates action with auto-generated code 00001 and percentage", async () => {
		const response = await crear(10, 7);
		expect(response.statusCode).toBe(201);
		expect(response.body.data.code).toBe("00001");
		expect(response.body.data.percentage).toBe(10);
		expect(response.body.data.nochesDeBeneficio).toBe(7);
		expect(response.body.data._id).toBeDefined();
		expect(typeof response.body.data._id).toBe("string");
	});

	it("POST /api/acciones creates next code 00002", async () => {
		await crear(10);
		const response = await crear(20);
		expect(response.statusCode).toBe(201);
		expect(response.body.data.code).toBe("00002");
		expect(response.body.data.percentage).toBe(20);
	});

	it("POST /api/acciones stores decimal percentage", async () => {
		const response = await crear(25.5);
		expect(response.statusCode).toBe(201);
		expect(response.body.data.percentage).toBe(25.5);
	});

	it("POST /api/acciones returns 400 without percentage", async () => {
		const response = await crear(undefined);
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBeDefined();
	});

	it("POST /api/acciones returns 400 for percentage > 100", async () => {
		const response = await crear(101);
		expect(response.statusCode).toBe(400);
	});

	it("POST /api/acciones returns 400 for negative percentage", async () => {
		const response = await crear(-5);
		expect(response.statusCode).toBe(400);
	});

	it("POST /api/acciones returns 400 for non-numeric percentage", async () => {
		const response = await crear("abc");
		expect(response.statusCode).toBe(400);
	});

	it("POST /api/acciones creates action with default nochesDeBeneficio if not provided", async () => {
		const response = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: 10 });
		expect(response.statusCode).toBe(201);
		expect(response.body.data.nochesDeBeneficio).toBe(0);
	});

	it("POST /api/acciones returns 400 for negative nochesDeBeneficio", async () => {
		const response = await crear(10, -1);
		expect(response.statusCode).toBe(400);
	});

	it("POST /api/acciones returns 400 for non-integer nochesDeBeneficio", async () => {
		const response = await crear(10, 2.5);
		expect(response.statusCode).toBe(400);
	});

	it("POST /api/acciones returns 403 for non-admin", async () => {
		const response = await request(app)
			.post("/api/acciones")
			.set("Authorization", `Bearer ${nonAdminToken}`)
			.send({ percentage: 10 });
		expect(response.statusCode).toBe(403);
	});

	it("PUT /api/acciones/:id updates only code (percentage untouched)", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00099" });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.code).toBe("00099");
		expect(response.body.data.percentage).toBe(10);
	});

	it("PUT /api/acciones/:id updates only percentage (code untouched)", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: 42.5 });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.code).toBe("00001");
		expect(response.body.data.percentage).toBe(42.5);
	});

	it("PUT /api/acciones/:id rejects other fields", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00098", name: "Hack" });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects bad code format", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "123" });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects percentage > 100", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: 150 });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects percentage outside range (negative)", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: -1 });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id updates only nochesDeBeneficio (code and percentage untouched)", async () => {
		const createRes = await crear(10, 3);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ nochesDeBeneficio: 14 });
		expect(response.statusCode).toBe(200);
		expect(response.body.data.nochesDeBeneficio).toBe(14);
		expect(response.body.data.code).toBe("00001");
		expect(response.body.data.percentage).toBe(10);
	});

	it("PUT /api/acciones/:id rejects negative nochesDeBeneficio", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ nochesDeBeneficio: -3 });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects non-integer nochesDeBeneficio", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ nochesDeBeneficio: 2.5 });
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects when neither code nor percentage provided", async () => {
		const createRes = await crear(10);
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({});
		expect(response.statusCode).toBe(400);
	});

	it("PUT /api/acciones/:id rejects duplicate code", async () => {
		await crear(10); // 00001
		const createRes = await crear(10); // 00002
		const id = createRes.body.data._id;
		
		const response = await request(app)
			.put(`/api/acciones/${id}`)
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ code: "00001" });
		expect(response.statusCode).toBe(409);
	});

	it("PUT /api/acciones/:id returns 404 for unknown id", async () => {
		const response = await request(app)
			.put("/api/acciones/00000000-0000-4000-8000-000000000000")
			.set("Authorization", `Bearer ${adminToken}`)
			.send({ percentage: 10 });
		expect(response.statusCode).toBe(404);
	});

	it("DELETE /api/acciones/:id deletes action", async () => {
		const createRes = await crear(10);
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

	it("GET /api/acciones/total returns 401 without token", async () => {
		const response = await request(app).get("/api/acciones/total");
		expect(response.statusCode).toBe(401);
	});

	it("GET /api/acciones/total returns 0 when empty", async () => {
		const response = await request(app)
			.get("/api/acciones/total")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.totalPercentage).toBe(0);
	});

	it("GET /api/acciones/total sums all acciones (ignores pagination)", async () => {
		await crear(25);
		await crear(25.5);
		await crear(10);
		const response = await request(app)
			.get("/api/acciones/total")
			.set("Authorization", `Bearer ${adminToken}`);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.totalPercentage).toBe(60.5);
	});
});
