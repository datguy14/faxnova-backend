import { sanitizePayload } from "../src/utils/sanitize.js";

describe("Data Sovereignty: PII Protection & Payload Sanitization", () => {
  const rawPayload = {
    faxId: "ABC123",
    to: "+18885551234",
    from: "+18885554321",
    fileUrl: "https://example.com/file.pdf",
    internalNotes: "Sensitive tribal metadata",
    provider: "sinch",
    status: "queued",
    timestamp: "2026-06-08T12:00:00Z"
  };

  it("removes all PII fields before logging", () => {
    const sanitized = sanitizePayload(rawPayload);

    expect(sanitized.to).toBeUndefined();
    expect(sanitized.from).toBeUndefined();
    expect(sanitized.fileUrl).toBeUndefined();
    expect(sanitized.internalNotes).toBeUndefined();
  });

  it("preserves only sovereignty‑approved fields", () => {
    const sanitized = sanitizePayload(rawPayload);

    expect(sanitized.faxId).toBe("ABC123");
    expect(sanitized.status).toBe("queued");
    expect(sanitized.provider).toBe("sinch");
    expect(sanitized.timestamp).toBe("2026-06-08T12:00:00Z");
  });

  it("does not mutate the original payload", () => {
    const copy = structuredClone(rawPayload);
    sanitizePayload(rawPayload);
    expect(rawPayload).toEqual(copy);
  });

  it("rejects unexpected fields to prevent accidental data leakage", () => {
    const payloadWithExtra = {
      ...rawPayload,
      tribalEnrollmentNumber: "999999",
      censusId: "123456789"
    };

    const sanitized = sanitizePayload(payloadWithExtra);

    expect(sanitized.tribalEnrollmentNumber).toBeUndefined();
    expect(sanitized.censusId).toBeUndefined();
  });
});
