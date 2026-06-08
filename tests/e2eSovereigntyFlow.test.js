import request from "supertest";
import express from "express";

import faxRoutes from "../src/routes/faxRoutes.js";
import webhookRoutes from "../src/routes/webhookRoutes.js";

// Mocks
jest.mock("../src/middleware/tribalAuth.js", () => ({
  tribalAuth: jest.fn((req, res, next) => next())
}));

jest.mock("../src/utils/verifySignature.js", () => ({
  verifySignature: jest.fn(() => true)
}));

jest.mock("../src/services/auditService.js", () => ({
  writeAuditLog: jest.fn(async (event) => ({
    ...event,
    timestamp: new Date().toISOString()
  }))
}));

jest.mock("../src/services/faxService.js", () => ({
  sendFax: jest.fn(async (payload) => ({
    faxId: "FAX-123",
    provider: "sinch",
    status: "queued",
    failoverUsed: false
  }))
}));

import { tribalAuth } from "../src/middleware/tribalAuth.js";
import { verifySignature } from "../src/utils/verifySignature.js";
import { writeAuditLog } from "../src/services/auditService.js";
import { sendFax } from "../src/services/faxService.js";

const app = express();
app.use(express.json());
app.use("/fax", faxRoutes);
app.use("/webhook", webhookRoutes);

describe("Sovereign E2E: Full Fax Lifecycle Under Tribal Security", () => {
  let faxId;

  const faxPayload = {
    to: "+18885551234",
    from: "+18885554321",
    fileUrl: "https://example.com/file.pdf"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends a fax under valid tribal authentication", async () => {
    tribalAuth.mockImplementation((req, res, next) => next());
    sendFax.mockResolvedValue({
      faxId: "FAX-123",
      provider: "sinch",
      status: "queued",
      failoverUsed: false
    });

    const res = await request(app)
      .post("/fax/send")
      .set("x-tribal-auth", "valid-token")
      .send(faxPayload);

    expect(res.status).toBe(200);
    expect(tribalAuth).toHaveBeenCalled();
    expect(sendFax).toHaveBeenCalled();

    faxId = res.body.faxId;
    expect(faxId).toBe("FAX-123");
  });

  it("receives a signed webhook update and logs the event", async () => {
    verifySignature.mockReturnValue(true);
    writeAuditLog.mockResolvedValue({
      action: "FAX_DELIVERED",
      faxId,
      actor: "system",
      provider: "sinch",
      timestamp: new Date().toISOString()
    });

    const res = await request(app)
      .post("/webhook/fax-status")
      .set("x-faxnova-signature", "valid-signature")
      .send({
        faxId,
        status: "delivered",
        provider: "sinch"
      });

    expect(res.status).toBe(200);
    expect(verifySignature).toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "FAX_DELIVERED",
        faxId,
        provider: "sinch"
      })
    );
  });

  it("rejects unsigned webhook updates even after a valid send", async () => {
    verifySignature.mockReturnValue(false);

    const res = await request(app)
      .post("/webhook/fax-status")
      .send({
        faxId,
        status: "delivered",
        provider: "sinch"
      });

    expect(res.status).toBe(401);
    expect(verifySignature).toHaveBeenCalled();
    expect(writeAuditLog).not.toHaveBeenCalled();
  });
});
