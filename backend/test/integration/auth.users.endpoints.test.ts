import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.ts";
import { beforeAll, beforeEach, afterEach, describe, it, expect } from "vitest";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-dev-secret";

describe("Auth and Users Endpoints", () => {
  let adminToken: string;
  let normalUserToken: string;
  let adminId: string;
  let normalUserId: string;
  let secondAdminId: string;

  beforeAll(async () => {
    // 1. Login as admin (seeds admin if empty)
    const loginRes = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "admin" });
      
    expect(loginRes.statusCode).toBe(200);
    adminToken = loginRes.body.token;
    
    // 2. Get admin ID
    const usersRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
      
    expect(usersRes.statusCode).toBe(200);
    const adminUser = usersRes.body.data.find((u: any) => u.username === "admin");
    adminId = adminUser.id;
    
    // 3. Create a normal user
    const createNormalRes = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "normaluser", password: "pass1234", role: "user" });
      
    expect(createNormalRes.statusCode).toBe(201);
    normalUserId = createNormalRes.body.data.id;
    
    // 4. Get normal user token
    const normalLoginRes = await request(app)
      .post("/api/login")
      .send({ username: "normaluser", password: "pass1234" });
      
    expect(normalLoginRes.statusCode).toBe(200);
    normalUserToken = normalLoginRes.body.token;
    
    // 5. Create a second admin (to test last admin logic)
    const createAdmin2Res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "admin2", password: "pass1234", role: "admin" });
      
    expect(createAdmin2Res.statusCode).toBe(201);
    secondAdminId = createAdmin2Res.body.data.id;
  });

  afterEach(async () => {
    // Clean up any extra users created in tests if necessary, 
    // but for simplicity we rely on the fresh DB per test file if possible,
    // or we just don't clean up in afterEach to avoid complexity,
    // as the DB is in-memory and likely fresh per test file execution.
    // However, if tests run in same file, state persists.
    // We will handle cleanup in specific tests if needed.
  });

  describe("POST /api/login", () => {
    it("should login with valid admin credentials", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ username: "admin", password: "admin" });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.username).toBe("admin");
      expect(res.body.role).toBe("admin");
    });

    it("should fail with invalid password", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ username: "admin", password: "wrongpass" });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should fail with missing fields", async () => {
      const res = await request(app)
        .post("/api/login")
        .send({ username: "admin" });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Username and password are required");
    });
  });

  describe("GET /api/me", () => {
    it("should return current user info", async () => {
      const res = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe("admin");
      expect(res.body.role).toBe("admin");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/me");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("Users CRUD", () => {
    it("should list users for admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      // Should contain admin, normaluser, admin2
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      const firstUser = res.body.data[0];
      expect(firstUser.passwordHash).toBeUndefined();
      expect(firstUser.username).toBeDefined();
    });

    it("should return 403 for normal user on list users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${normalUserToken}`);
      
      expect(res.statusCode).toBe(403);
    });

    it("should create a user", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "testuser", password: "testpass", role: "user" });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.username).toBe("testuser");
      expect(res.body.data.role).toBe("user");
      
      // Cleanup
      const userId = res.body.data.id;
      await request(app)
        .delete(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
    });

    it("should prevent duplicate username", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "admin", password: "pass1234", role: "user" });
      
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe("Username already in use");
    });

    it("should validate role on create", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "badroleuser", password: "pass1234", role: "superadmin" });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Role must be admin or user");
    });

    it("should update user role", async () => {
      const res = await request(app)
        .put(`/api/users/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe("admin");
      
      // Revert role
      const revertRes = await request(app)
        .put(`/api/users/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "user" });
      expect(revertRes.statusCode).toBe(200);
      expect(revertRes.body.data.role).toBe("user");
    });

    it("should prevent deleting last admin", async () => {
      // Setup: Admin (admin) is the one requesting.
      // We need to be in a state where the target is the last admin.
      // Currently we have: admin, normaluser, admin2.
      // If we delete admin2, we have admin, normaluser.
      // Then if admin tries to delete admin (self), it is the last admin.
      
      // First, delete admin2
      const delAdmin2Res = await request(app)
        .delete(`/api/users/${secondAdminId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(delAdmin2Res.statusCode).toBe(200);

      // Now try to delete self (admin) who is the last admin
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe("Cannot delete the last admin");
    });

    it("should prevent deleting self if not last admin", async () => {
      // Setup: We have admin, normaluser, admin2 (re-created or still there? 
      // In previous test, we deleted admin2. So now we have admin, normaluser.
      // Let's recreate admin2 for this test or use a different scenario.
      // Actually, let's create a new admin "admin3" to ensure count > 1.
      
      const createAdmin3Res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "admin3", password: "pass1234", role: "admin" });
      expect(createAdmin3Res.statusCode).toBe(201);
      const admin3Id = createAdmin3Res.body.data.id;

      // Now we have admin, normaluser, admin3. Admin is not the last admin.
      // Admin tries to delete self.
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe("Cannot delete your own account");
      
      // Cleanup admin3
      await request(app)
        .delete(`/api/users/${admin3Id}`)
        .set("Authorization", `Bearer ${adminToken}`);
    });
  });
});