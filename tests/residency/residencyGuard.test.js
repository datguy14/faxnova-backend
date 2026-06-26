const request = require("supertest");
const express = require("express");
const residencyGuard = require("../src/middleware/residencyGuard");

describe("residencyGuard middleware", () => {
  it("allows access when no required zones are set", async () => {
    const app = express();
    app.get("/test", residencyGuard(), (req, res) => res.json({ ok: true }));

    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
  });

  it("blocks access when zone is not allowed", async () => {
    const app = express();
    app.get("/test", residencyGuard(["us"]), (req, res) => res.json({ ok: true }));

    const res = await request(app).get("/test").set("x-country", "eu");
    expect(res.status).toBe(403);
  });

  it("allows access when zone matches", async () => {
    const app = express();
    app.get("/test", residencyGuard(["us"]), (req, res) => res.json({ ok: true }));

    const res = await request(app).get("/test").set("x-country", "us");
    expect(res.status).toBe(200);
  });
});
