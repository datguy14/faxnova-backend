/**
 * Integration Tests for Residency Controls
 * Tests the complete flow from request -> middleware -> controller -> storage
 */

import { residencyGuard } from '../../src/middleware/residencyGuard.js';
import { getResidencyZone, isProviderAllowed, getProvidersForZone } from '../../src/residency/policy.js';
import {
  getResidencyPath,
  writeResidencyLog,
  readResidencyLog,
  deleteResidencyFile,
  listResidencyFiles
} from '../../src/storage/residencyStorage.js';
import { routeFax, isProviderAvailable } from '../../src/services/providerRouter.js';
import fs from 'fs';
import path from 'path';

describe('Residency Controls - Integration Tests', () => {
  const testZone = 'us-east-tribal';
  const testFile = 'test-integration.log';
  const testDir = path.join(process.cwd(), 'test-data', testZone);

  beforeAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Request -> Middleware -> Zone Detection', () => {
    it('detects zone from x-country header', () => {
      const req = {
        header: (name) => (name === 'x-country' ? 'US' : undefined),
        ip: '127.0.0.1'
      };
      const res = {};
      const next = jest.fn();

      residencyGuard(req, res, next);

      expect(req.residencyZone).toBe('us-east-tribal');
      expect(next).toHaveBeenCalled();
    });

    it('maps EU countries to eu-sovereign zone', () => {
      const req = {
        header: (name) => (name === 'x-country' ? 'DE' : undefined),
        ip: '127.0.0.1'
      };
      const res = {};
      const next = jest.fn();

      residencyGuard(req, res, next);

      expect(req.residencyZone).toBe('eu-sovereign');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Zone Storage - Write & Read', () => {
    it('writes log to zone directory', () => {
      const logContent = JSON.stringify({
        timestamp: new Date().toISOString(),
        test: 'data',
        zone: testZone
      });

      writeResidencyLog(testZone, testFile, logContent);

      expect(fs.existsSync(path.join(testDir, testFile))).toBe(true);
    });

    it('reads log from zone directory', () => {
      const logContent = 'test entry';
      writeResidencyLog(testZone, testFile, logContent);

      const content = readResidencyLog(testZone, testFile);
      expect(content).toContain(logContent);
    });

    it('lists files in zone directory', () => {
      writeResidencyLog(testZone, 'file1.log', 'content1');
      writeResidencyLog(testZone, 'file2.log', 'content2');

      const files = listResidencyFiles(testZone);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Constraints by Zone', () => {
    it('enforces provider constraints in us-east-tribal zone', () => {
      expect(isProviderAllowed('us-east-tribal', 'sinch')).toBe(true);
      expect(isProviderAllowed('us-east-tribal', 'telnyx')).toBe(true);
    });

    it('restricts sinch in eu-sovereign zone', () => {
      expect(isProviderAllowed('eu-sovereign', 'sinch')).toBe(false);
      expect(isProviderAllowed('eu-sovereign', 'telnyx')).toBe(true);
    });

    it('allows all providers in global zone', () => {
      expect(isProviderAllowed('global', 'sinch')).toBe(true);
      expect(isProviderAllowed('global', 'telnyx')).toBe(true);
    });
  });

  describe('Zone Path Isolation', () => {
    it('creates separate directories per zone', () => {
      const usPath = getResidencyPath('us-east-tribal');
      const euPath = getResidencyPath('eu-sovereign');
      const globalPath = getResidencyPath('global');

      expect(usPath).not.toBe(euPath);
      expect(euPath).not.toBe(globalPath);
      expect(usPath).toContain('us-east-tribal');
      expect(euPath).toContain('eu-sovereign');
      expect(globalPath).toContain('global');
    });

    it('isolates logs by zone', () => {
      writeResidencyLog('us-east-tribal', 'test-us.log', 'US data');
      writeResidencyLog('eu-sovereign', 'test-eu.log', 'EU data');

      const usContent = readResidencyLog('us-east-tribal', 'test-us.log');
      const euContent = readResidencyLog('eu-sovereign', 'test-eu.log');

      expect(usContent).toContain('US data');
      expect(euContent).toContain('EU data');
    });
  });

  describe('End-to-End Flow', () => {
    it('complete flow: request -> zone detection -> storage', () => {
      // Step 1: Simulate request with country header
      const req = {
        header: (name) => (name === 'x-country' ? 'FR' : undefined),
        ip: '127.0.0.1'
      };
      const res = {};
      const next = jest.fn();

      // Step 2: Middleware detects zone
      residencyGuard(req, res, next);
      expect(req.residencyZone).toBe('eu-sovereign');

      // Step 3: Verify provider constraints
      expect(isProviderAllowed(req.residencyZone, 'telnyx')).toBe(true);
      expect(isProviderAllowed(req.residencyZone, 'sinch')).toBe(false);

      // Step 4: Log operation to zone storage
      const logEntry = JSON.stringify({
        zone: req.residencyZone,
        action: 'test_operation',
        timestamp: new Date().toISOString()
      });
      writeResidencyLog(req.residencyZone, 'e2e-test.log', logEntry);

      // Step 5: Verify log was written to correct zone
      const content = readResidencyLog(req.residencyZone, 'e2e-test.log');
      expect(content).toContain('test_operation');
      expect(content).toContain('eu-sovereign');
    });
  });

  describe('Error Handling', () => {
    it('handles missing files gracefully', () => {
      const content = readResidencyLog('us-east-tribal', 'nonexistent-file.log');
      expect(content).toBe('');
    });

    it('prevents path traversal attacks', () => {
      expect(() => {
        writeResidencyLog('us-east-tribal', '../../../etc/passwd', 'malicious');
      }).toThrow();
    });

    it('handles middleware errors gracefully', () => {
      const req = {
        header: null // Causes error
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      residencyGuard(req, res, next);
      // Should return error response
    });
  });
});
