import request from "supertest";
import express from "express";

// Mock your signature verification utility
jest.mock("../src/utils/verifySignature.js", () => ({
  verifySignature: jest.fn()
}));

import { verifySignature } from "../src/utils/verifySignature.js";
import webhookRoutes from "../src/routes/webhookRoutes.js";

const app = express();
app.use(express.json());
app.use("/webhook", webhookRoutes);

describe("Webhook Sovereignty: Signature Verification", () => {
  const validPayload = {
    faxId: "ABC123",
    status: "delivered",
    provider: "sinch"
  };

  it("rejects unsigned webhook requests", async () => {
    verifySignature.mockReturnValue(false);

    const res = await request(app)
      .post("/webhook/fax-status")
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(verifySignature).toHaveBeenCalled();
  });

  it("rejects webhook requests with invalid signatures", async () => {
    verifySignature.mockReturnValue(false);

    const res = await request(app)
      .post("/webhook/fax-status")
      .set("x-faxnova-signature", "invalid-signature")
      .send(validPayload);

    expect(res.status).toBe(401);
    expect(verifySignature).toHaveBeenCalled();
  });

  it("accepts webhook requests with a valid signature", async () => {
    verifySignature.mockReturnValue(true);

    const res = await request(app)
      .post("/webhook/fax-status")
      .set("x-faxnova-signature", "valid-signature")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(verifySignature).toHaveBeenCalled();
  });

  it("does not process tribal data when signature is invalid", async () => {
    verifySignature.mockReturnValue(false);

    const res = await request(app)
      .post("/webhook/fax-status")
      .set("x-faxnova-signature", "tampered")
      .send({
        faxId: "ABC123",
        status: "delivered",
        tribalEnrollmentNumber: "999999"
      });

    expect(res.status).toBe(401);
  });
});
