const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "dev-admin-secret";

describe("Admin Auth Tests", () => {
  test("Rejects invalid login", async () => {
    const res = await request(app)
      .post("/auth/admin/login")
      .send({ username: "wrong", password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("Accepts valid login and returns JWT", async () => {
    const res = await request(app)
      .post("/auth/admin/login")
      .send({ username: "root", password: "changeme" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    // Verify token structure
    const decoded = jwt.verify(res.body.token, JWT_ADMIN_SECRET);
    expect(decoded.role).toBe("admin");
    expect(decoded.username).toBe("root");
  });

  test("Rejects protected route without token", async () => {
    const res = await request(app).get("/auth/admin/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing admin token");
  });

  test("Rejects protected route with invalid token", async () => {
    const res = await request(app)
      .get("/auth/admin/me")
      .set("Authorization", "Bearer invalidtoken123");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  test("Allows access with valid admin token", async () => {
    // Create a valid token manually
    const token = jwt.sign(
      { role: "admin", username: "root" },
      JWT_ADMIN_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/auth/admin/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.admin).toBeDefined();
    expect(res.body.admin.username).toBe("root");
    expect(res.body.admin.role).toBe("admin");
  });
});
