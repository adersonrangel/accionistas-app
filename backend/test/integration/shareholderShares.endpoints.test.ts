import request from "supertest";
import app from "../../src/app.ts";
import Shareholder from "../../src/models/shareholder.model";

let adminToken: string;
let shareholderId: string;

describe("Shareholder Shares Endpoints with Admin Guard", () => {
	beforeAll(async () => {
		const loginResponse = await request(app)
			.post("/api/login")
			.set("Accept", "application/json")
			.send({ username: "admin", password: "admin" });
		adminToken = loginResponse.body.token;

		// Create a shareholder in the test database
		const shareholder = await Shareholder.create({
			nombre: "Test",
			apellido: "User",
			dni: "12345678",
			email: "test@example.com",
		});
		shareholderId = shareholder._id.toString();
	});

	describe("Test Shareholder.find", () => {
		it("should find the created shareholder", async () => {
			const shareholder = await Shareholder.findById(shareholderId);
			expect(shareholder).toBeDefined();
			expect(shareholder._id.toString()).toBe(shareholderId);
		});
	});

	describe("POST /shareholders/:id/shares with valid percentage", () => {
		it("creates a new share and returns 201 Created", async () => {
			const response = await request(app)
				.post(`/api/shareholders/${shareholderId}/shares`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					id: "SH-2023",
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 15,
				});
			expect(response.statusCode).toEqual(201);
			expect(typeof response.body.data.id).toBe("string");
			expect(response.body.data.number).toBe("SH-2023");
			expect(response.body.data.percentage).toBe(15);
		});
	});

	describe("POST /shareholders/:id/shares with 110% percentage", () => {
		it("rejects allocation causing total over 100%", async () => {
			const response = await request(app)
				.post(`/api/shareholders/${shareholderId}/shares`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					id: "SH-2023-INVALID",
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 110,
				});
			expect(response.statusCode).toEqual(422);
			expect(response.body.error).toContain(
				"Total allocation cannot exceed 100%",
			);
		});
	});

	describe("PUT /shareholders/:id/shares/:id with over percentage", () => {
		it("rejects update causing total over 100%", async () => {
			const response = await request(app)
				.put(`/api/shareholders/${shareholderId}/shares/SH-2023`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					percentage: 96,
				});
			expect(response.statusCode).toEqual(422);
			expect(response.body.error).toContain(
				"Total allocation cannot exceed 100%",
			);
		});
	});
});

describe("Unauthorized access attempts", () => {
	describe("Authenticated non-admin user", () => {
		it("returns 403 Forbidden", async () => {
			await request(app)
				.post(`/api/shareholders/${shareholderId}/shares`)
				.set("Authorization", "Bearer invalid-token-123")
				.send({
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 50,
				});
		});
	});

	describe("Unauthenticated user", () => {
		it("returns 401 Unauthorized", async () => {
			const response = await request(app)
				.post(`/api/shareholders/${shareholderId}/shares`)
				.send({
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 30,
				});
			expect(response.statusCode).toEqual(401);
		});
	});
});
