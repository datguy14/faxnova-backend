import fs from "fs";
import path from "path";
import { writeAuditLog } from "../src/services/auditService.js";

const LOG_PATH = path.join(process.cwd(), "logs", "audit.log");

describe("Audit Sovereignty: Immutable Audit Trail", () => {
  const event = {
    action: "FAX_SENT",
    faxId: "ABC123",
    actor: "system",
    provider: "sinch",
    timestamp: "2026-06-08T12:00:00Z"
  };

  beforeEach(() => {
    if (!fs.existsSync("logs")) fs.mkdirSync("logs");
    fs.writeFileSync(LOG_PATH, ""); // reset log file
  });

  it("creates a valid audit log entry", async () => {
    const entry = await writeAuditLog(event);

    expect(entry).toHaveProperty("timestamp");
    expect(entry.action).toBe("FAX_SENT");
    expect(entry.faxId).toBe("ABC123");
    expect(entry.actor).toBe("system");
  });

  it("appends new entries without overwriting existing logs", async () => {
    await writeAuditLog(event);
    const before = fs.readFileSync(LOG_PATH, "utf8");

    await writeAuditLog(event);
    const after = fs.readFileSync(LOG_PATH, "utf8");

    expect(after.length).toBeGreaterThan(before.length);
  });

  it("prevents modification of existing audit entries", async () => {
    await writeAuditLog(event);
    const before = fs.readFileSync(LOG_PATH, "utf8");

    try {
      fs.writeFileSync(LOG_PATH, "MALICIOUS OVERRIDE");
    } catch (err) {
      // expected: file should be locked or protected
    }

    const after = fs.readFileSync(LOG_PATH, "utf8");

    expect(after).toBe(before);
  });

  it("does not log tribal-sensitive fields", async () => {
    const payloadWithTribalData = {
      ...event,
      tribalEnrollmentNumber: "999999",
      censusId: "123456789"
    };

    await writeAuditLog(payloadWithTribalData);

    const logContents = fs.readFileSync(LOG_PATH, "utf8");

    expect(logContents.includes("tribalEnrollmentNumber")).toBe(false);
    expect(logContents.includes("censusId")).toBe(false);
  });

  it("does not mutate the original event object", async () => {
    const copy = structuredClone(event);
    await writeAuditLog(event);
    expect(event).toEqual(copy);
  });
});
