import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./src/app.js";
import accionistaModule from "./src/models/accionista.js";
import Accion from "./src/models/accion.model.ts";
import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";

const { Accionista } = accionistaModule as any;
const SECRET = process.env.JWT_SECRET || "changeme-dev-secret";
let server: any;
let baseUrl = "";

// Regression: server.js starts with app.js (CommonJS), not app.ts. The
// assignment routes must be mounted there too, otherwise the running
// server answers HTML "Cannot POST" and the frontend res.json() fails.
describe("app.js (server real) asignacion", () => {
	beforeAll(async () => {
		const srv = app.listen(0);
		await new Promise((r) => srv.on("listening", () => r(null)));
		server = srv;
		baseUrl = `http://127.0.0.1:${(srv.address() as any).port}`;
		// app.js mounts the .ts routes via dynamic import; wait until the
		// mount exists (a JSON 401/400 probe, not an HTML 404).
		const deadline = Date.now() + 5000;
		for (;;) {
			const probe = await request(baseUrl)
				.post("/api/accionistas/1/acciones")
				.send({});
			if (probe.headers["content-type"]?.includes("json")) break;
			if (Date.now() > deadline)
				throw new Error("rutas de app.js no montadas a tiempo");
			await new Promise((r) => setTimeout(r, 50));
		}
	});
	afterAll(async () => {
		server?.close();
	});
	beforeEach(async () => {
		await Accionista.deleteMany({});
		await Accion.deleteMany({});
	});

	it("POST asigna con JSON 200 (no HTML 404)", async () => {
		const doc = await Accionista.create({
			id: 1,
			nombre: "X",
			apellido: "Y",
			dni: "1",
			email: "e@e.com",
		});
		const a = await Accion.create({ code: "00001", percentage: 10 });
		const token = jwt.sign(
			{ username: "admin", role: "admin" },
			SECRET,
			{ expiresIn: "1h" }
		);
		const res = await request(baseUrl)
			.post(`/api/accionistas/${doc.id}/acciones`)
			.set("Authorization", `Bearer ${token}`)
			.send({ accionIds: [a._id] });
		expect(res.headers["content-type"]).toContain("json");
		expect(res.status).toBe(200);
		expect(res.body.skipped).toEqual([]);
	});

	it("GET /api/acciones/disponibles existe (JSON 200)", async () => {
		await Accion.create({ code: "00001", percentage: 10 });
		const token = jwt.sign(
			{ username: "u", role: "admin" },
			SECRET,
			{ expiresIn: "1h" }
		);
		const res = await request(baseUrl)
			.get("/api/acciones/disponibles")
			.set("Authorization", `Bearer ${token}`);
		expect(res.headers["content-type"]).toContain("json");
		expect(res.status).toBe(200);
		expect(res.body.data.map((x: any) => x.code)).toEqual(["00001"]);
	});

	it("POST sin token -> JSON 401 (no HTML)", async () => {
		const res = await request(baseUrl)
			.post("/api/accionistas/1/acciones")
			.send({ accionIds: ["x"] });
		expect(res.headers["content-type"]).toContain("json");
		expect(res.status).toBe(401);
	});
});
