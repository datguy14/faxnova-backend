/**
 * Tests for Residency-Aware Storage Adapter
 */

import fs from "fs";
import path from "path";
import {
  getResidencyPath,
  getResidencyFilePath,
  writeResidencyLog,
  readResidencyLog,
  writeResidencyJSON,
  readResidencyJSON,
  deleteResidencyFile,
  listResidencyFiles
} from "../../src/storage/residencyStorage.js";

jest.mock("fs");
jest.mock("path");

describe("Residency Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getResidencyPath", () => {
    it("creates directory for zone if not exists", () => {
      fs.existsSync.mockReturnValue(false);
      path.join.mockImplementation((...args) => args.join("/"));

      getResidencyPath("us-east-tribal");

      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it("returns path without creating if directory exists", () => {
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join("/"));

      getResidencyPath("us-east-tribal");

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("getResidencyFilePath", () => {
    it("constructs safe file path", () => {
      path.join.mockImplementation((...args) => args.join("/"));
      fs.existsSync.mockReturnValue(true);

      const result = getResidencyFilePath("us-east-tribal", "audit.log");

      expect(result).toBeDefined();
    });

    it("prevents path traversal", () => {
      expect(() => getResidencyFilePath("us-east-tribal", "../etc/passwd")).toThrow();
      expect(() => getResidencyFilePath("us-east-tribal", "foo/bar")).toThrow();
      expect(() => getResidencyFilePath("us-east-tribal", "foo\\bar")).toThrow();
    });
  });

  describe("writeResidencyLog", () => {
    it("appends line to log file", () => {
      fs.existsSync.mockReturnValue(true);
      fs.appendFileSync.mockImplementation(() => {});
      path.join.mockImplementation((...args) => args.join("/"));

      writeResidencyLog("us-east-tribal", "audit.log", "test entry");

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("test entry"),
        expect.anything()
      );
    });
  });

  describe("readResidencyLog", () => {
    it("reads log file contents", () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue("log content");
      path.join.mockImplementation((...args) => args.join("/"));

      const result = readResidencyLog("us-east-tribal", "audit.log");

      expect(result).toBe("log content");
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it("returns empty string if file not found", () => {
      fs.existsSync.mockReturnValue(false);
      path.join.mockImplementation((...args) => args.join("/"));

      const result = readResidencyLog("us-east-tribal", "audit.log");

      expect(result).toBe("");
    });
  });

  describe("writeResidencyJSON", () => {
    it("writes JSON data to file", () => {
      fs.writeFileSync.mockImplementation(() => {});
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join("/"));

      const data = { test: "data", value: 123 };
      writeResidencyJSON("us-east-tribal", "config.json", data);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        JSON.stringify(data, null, 2),
        expect.anything()
      );
    });
  });

  describe("readResidencyJSON", () => {
    it("reads and parses JSON file", () => {
      const data = { test: "data" };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(data));
      path.join.mockImplementation((...args) => args.join("/"));

      const result = readResidencyJSON("us-east-tribal", "config.json");

      expect(result).toEqual(data);
    });

    it("returns null if file not found", () => {
      fs.existsSync.mockReturnValue(false);
      path.join.mockImplementation((...args) => args.join("/"));

      const result = readResidencyJSON("us-east-tribal", "config.json");

      expect(result).toBeNull();
    });
  });

  describe("deleteResidencyFile", () => {
    it("deletes file from zone directory", () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});
      path.join.mockImplementation((...args) => args.join("/"));

      deleteResidencyFile("us-east-tribal", "audit.log");

      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe("listResidencyFiles", () => {
    it("lists files in zone directory", () => {
      fs.readdirSync.mockReturnValue(["audit.log", "config.json"]);
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join("/"));

      const result = listResidencyFiles("us-east-tribal");

      expect(result).toEqual(["audit.log", "config.json"]);
    });
  });
});
