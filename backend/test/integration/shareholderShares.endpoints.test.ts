import * as request from "supertest";
import app from "../../../src/server";

describe("Shareholder Shares Endpoints with Admin Guard", () => {
	let adminToken: string;

	beforeAll(async () => {
		const loginResponse = await request(app)
			.post("/api/login")
			.set("Accept", "application/json")
			.send({ username: "admin", password: "admin" });
		adminToken = loginResponse.body.token;
	});

	describe("POST /shareholders/:id/shares with valid percentage", () => {
		it("creates a new share and returns 201 Created", async () => {
			const response = await request(app)
				.post("/api/shareholders/123/shares")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 15,
				});
			expect(response.statusCode).toEqual(201);
			expect(response.body.id).toBeString();
			expect(response.body.number).toBe("SH-2023");
			expect(response.body.percentage).toBe(15);
		});
	});

	describe("POST /shareholders/:id/shares with 110% percentage", () => {
		it("rejects allocation causing total over 100%", async () => {
			const response = await request(app)
				.post("/api/shareholders/123/shares")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 110,
				});
			expect(response.statusCode).toEqual(422);
			expect(response.body.message).toContain(
				"Total allocation cannot exceed 100%",
			);
		});
	});

	describe("PUT /shareholders/:id/shares/:id with over percentage", () => {
		it("rejects update causing total over 100%", async () => {
			const response = await request(app)
				.put("/api/shareholders/123/shares/SH-2023")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({
					percentage: 96,
				});
			expect(response.statusCode).toEqual(422);
			expect(response.body.message).toContain(
				"Total allocation cannot exceed 100%",
			);
		});
	});
});

describe("Unauthorized access attempts", () => {
	describe("Authenticated non-admin user", () => {
		it("returns 403 Forbidden", async () => {
			await request(app)
				.post("/api/shareholders/123/shares")
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
				.post("/api/shareholders/123/shares")
				.send({
					number: "SH-2023",
					acquisitionDate: "2023-01-15",
					percentage: 30,
				});
			expect(response.statusCode).toEqual(401);
		});
	});
});
