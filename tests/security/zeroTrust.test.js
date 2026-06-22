import request from "supertest";
import express from "express";

// Mock tribal authentication middleware
jest.mock("../src/middleware/tribalAuth.js", () => ({
  tribalAuth: jest.fn((req, res, next) => next())
}));

import { tribalAuth } from "../src/middleware/tribalAuth.js";
import faxRoutes from "../src/routes/faxRoutes.js";

const app = express();
app.use(express.json());
app.use("/fax", faxRoutes);

describe("Zero‑Trust Sovereignty: Tribal Authentication Enforcement", () => {
  const faxPayload = {
    to: "+18885551234",
    from: "+18885554321",
    fileUrl: "https://example.com/file.pdf"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated fax requests", async () => {
    tribalAuth.mockImplementation((req, res) => {
      return res.status(401).json({ error: "Unauthorized" });
    });

    const res = await request(app)
      .post("/fax/send")
      .send(faxPayload);

    expect(res.status).toBe(401);
    expect(tribalAuth).toHaveBeenCalled();
  });

  it("rejects fax requests with invalid tribal credentials", async () => {
    tribalAuth.mockImplementation((req, res) => {
      return res.status(401).json({ error: "Invalid tribal token" });
    });

    const res = await request(app)
      .post("/fax/send")
      .set("x-tribal-auth", "invalid-token")
      .send(faxPayload);

    expect(res.status).toBe(401);
    expect(tribalAuth).toHaveBeenCalled();
  });

  it("accepts fax requests with valid tribal credentials", async () => {
    tribalAuth.mockImplementation((req, res, next) => next());

    const res = await request(app)
      .post("/fax/send")
      .set("x-tribal-auth", "valid-token")
      .send(faxPayload);

    expect(res.status).toBe(200);
    expect(tribalAuth).toHaveBeenCalled();
  });

  it("does not process tribal data when authentication fails", async () => {
    tribalAuth.mockImplementation((req, res) => {
      return res.status(401).json({ error: "Unauthorized" });
    });

    const res = await request(app)
      .post("/fax/send")
      .send({
        ...faxPayload,
        tribalEnrollmentNumber: "999999",
        censusId: "123456789"
      });

    expect(res.status).toBe(401);
  });
});
