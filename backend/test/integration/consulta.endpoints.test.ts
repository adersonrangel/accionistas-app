import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../../src/app.ts";
import Accion from "../../src/models/accion.model.ts";
import MovimientoNoches from "../../src/models/movimiento-noches.model.ts";
import accionistaModule from "../../src/models/accionista.js";
import { beforeAll, beforeEach, describe, it, expect } from "vitest";

const { Accionista } = accionistaModule as {
	Accionista: typeof import("mongoose").Model;
};

const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

describe("Consulta de accionista por DNI", () => {
	let adminToken: string;
	let userToken: string;
	let seq = 0;

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
		await Accionista.deleteMany({});
		await Accion.deleteMany({});
		await MovimientoNoches.deleteMany({});
		await mongoose.connection.db
			.collection("counters")
			.deleteMany({ _id: "accion_code" });
	});

	async function crearAccionistaConAcciones(
		dni: string,
		acciones: Array<{ code: string; percentage: number; noches: number }>
	) {
		const accionista = await (Accionista as unknown as {
			create: (doc: Record<string, unknown>) => Promise<{
				_id: unknown;
				id: number;
			}>;
		}).create({
			id: ++seq,
			nombre: "Test",
			apellido: "Accionista",
			dni,
			email: `test.${dni}@email.com`,
			fechaIngreso: "2024-01-15",
			telefono: "+5491100000000",
			direccion: "Calle Test 123",
		});

		for (const acc of acciones) {
			await Accion.create({
				code: acc.code,
				percentage: acc.percentage,
				nochesDeBeneficio: acc.noches,
				shareholderId: accionista._id,
			});
		}

		return accionista;
	}

	describe("GET /api/consulta/accionista/dni/:dni", () => {
		it("devuelve 404 cuando el DNI no existe", async () => {
			const res = await request(app)
				.get("/api/consulta/accionista/dni/99999999")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("No se encontró ningún accionista con ese DNI");
		});

		it("devuelve el accionista con noches totales calculadas de sus acciones", async () => {
			await crearAccionistaConAcciones("30111222", [
				{ code: "00001", percentage: 25, noches: 10 },
				{ code: "00002", percentage: 15, noches: 8 },
			]);

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30111222")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.dni).toBe("30111222");
			expect(res.body.data.nombre).toBe("Test");
			expect(res.body.data.apellido).toBe("Accionista");
			expect(res.body.data.noches.totales).toBe(18); // 10 + 8
			expect(res.body.data.noches.usadas).toBe(0);
			expect(res.body.data.noches.disponibles).toBe(18);
			expect(res.body.data.porcentajeAcciones).toBe(40); // 25 + 15
			expect(res.body.data.acciones).toHaveLength(2);
		});

		it("calcula noches disponibles restando los descuentos del historial", async () => {
			const accionista = await crearAccionistaConAcciones("30222333", [
				{ code: "00001", percentage: 20, noches: 12 },
			]);

			// Crear movimientos de descuento
			await MovimientoNoches.create({
				shareholderId: accionista._id,
				tipo: "descuento",
				cantidad: 3,
				motivo: "Reserva fin de semana",
				usuario: "admin",
				saldoAnterior: 12,
				saldoNuevo: 9,
			});
			await MovimientoNoches.create({
				shareholderId: accionista._id,
				tipo: "descuento",
				cantidad: 2,
				motivo: "Reserva semana",
				usuario: "admin",
				saldoAnterior: 9,
				saldoNuevo: 7,
			});

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30222333")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.noches.totales).toBe(12);
			expect(res.body.data.noches.usadas).toBe(5); // 3 + 2
			expect(res.body.data.noches.disponibles).toBe(7); // 12 - 5
		});

		it("las devoluciones suman a las noches disponibles", async () => {
			const accionista = await crearAccionistaConAcciones("30333444", [
				{ code: "00001", percentage: 10, noches: 10 },
			]);

			await MovimientoNoches.create({
				shareholderId: accionista._id,
				tipo: "descuento",
				cantidad: 4,
				motivo: "Reserva",
				usuario: "admin",
				saldoAnterior: 10,
				saldoNuevo: 6,
			});
			await MovimientoNoches.create({
				shareholderId: accionista._id,
				tipo: "devolucion",
				cantidad: 2,
				motivo: "Cancelación parcial",
				usuario: "admin",
				saldoAnterior: 6,
				saldoNuevo: 8,
			});

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30333444")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.noches.totales).toBe(10);
			expect(res.body.data.noches.usadas).toBe(2); // 4 - 2
			expect(res.body.data.noches.disponibles).toBe(8); // 10 - 2
		});

		it("accionista sin acciones tiene 0 noches", async () => {
			await crearAccionistaConAcciones("30444555", []);

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30444555")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.noches.totales).toBe(0);
			expect(res.body.data.noches.usadas).toBe(0);
			expect(res.body.data.noches.disponibles).toBe(0);
			expect(res.body.data.porcentajeAcciones).toBe(0);
			expect(res.body.data.acciones).toHaveLength(0);
		});

		it("noches disponibles nunca es negativo", async () => {
			const accionista = await crearAccionistaConAcciones("30555666", [
				{ code: "00001", percentage: 10, noches: 5 },
			]);

			// Descuento mayor al total (caso edge)
			await MovimientoNoches.create({
				shareholderId: accionista._id,
				tipo: "descuento",
				cantidad: 10,
				motivo: "Error histórico",
				usuario: "admin",
				saldoAnterior: 5,
				saldoNuevo: -5,
			});

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30555666")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.noches.disponibles).toBe(0); // No negativo
		});

		it("usuarios no-admin también pueden consultar", async () => {
			await crearAccionistaConAcciones("30666777", [
				{ code: "00001", percentage: 15, noches: 6 },
			]);

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30666777")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.dni).toBe("30666777");
			expect(res.body.data.noches.totales).toBe(6);
		});

		it("requiere autenticación (401 sin token)", async () => {
			const res = await request(app)
				.get("/api/consulta/accionista/dni/30111222");

			expect(res.status).toBe(401);
		});

		it("incluye datos de contacto del accionista", async () => {
			await crearAccionistaConAcciones("30777888", [
				{ code: "00001", percentage: 10, noches: 5 },
			]);

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30777888")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.email).toBe("test.30777888@email.com");
			expect(res.body.data.telefono).toBe("+5491100000000");
			expect(res.body.data.direccion).toBe("Calle Test 123");
			expect(res.body.data.fechaIngreso).toBe("2024-01-15");
		});

		it("las acciones incluyen code, percentage y nochesDeBeneficio", async () => {
			await crearAccionistaConAcciones("30888999", [
				{ code: "00001", percentage: 30, noches: 15 },
			]);

			const res = await request(app)
				.get("/api/consulta/accionista/dni/30888999")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.data.acciones[0].code).toBe("00001");
			expect(res.body.data.acciones[0].percentage).toBe(30);
			expect(res.body.data.acciones[0].nochesDeBeneficio).toBe(15);
		});
	});
});
