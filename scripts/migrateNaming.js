const fs = require("fs");
const path = require("path");

const TARGET_DIRS = [
  "src/models",
  "src/services",
  "src/controllers",
  "src/workers",
  "src/queues",
  "src/errors",
];

const REPLACEMENTS = {
  external_event_id: "externalEventId",
  provider_fax_id: "providerFaxId",
  residency_zone: "residencyZone",
  sovereignty_constraints: "sovereigntyConstraints",
  last_event_at: "lastEventAt",
  processed_at: "processedAt",
  created_at: "createdAt",
  detected_at: "detectedAt",
  resolved_at: "resolvedAt",
  failed_at: "failedAt",
  event_id: "eventId",
  attempts_made: "attemptsMade",
};

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let changed = false;

  Object.entries(REPLACEMENTS).forEach(([snake, camel]) => {
    const regex = new RegExp(snake, "g");
    if (regex.test(content)) {
      content = content.replace(regex, camel);
      changed = true;
      console.log(`✔ Updated ${snake} → ${camel} in ${filePath}`);
    }
  });

  content = content.replace(/\b[a-z]+_[a-z0-9_]+\b/g, (match) => {
    const camel = toCamelCase(match);
    if (camel !== match) {
      console.log(`✔ Auto-converted ${match} → ${camel} in ${filePath}`);
      changed = true;
    }
    return camel;
  });

  if (changed) {
    const backupPath = filePath + ".bak";
    fs.writeFileSync(backupPath, originalContent);
    fs.writeFileSync(filePath, content);
  }
}

function scanDir(dir) {
  const fullDir = path.join(process.cwd(), dir);

  if (!fs.existsSync(fullDir)) return;

  fs.readdirSync(fullDir).forEach((file) => {
    const fullPath = path.join(fullDir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".js") || file.endsWith(".ts")) {
      processFile(fullPath);
    }
  });
}

console.log("🚀 Starting FaxNova naming migration (snake_case → camelCase)…\n");

TARGET_DIRS.forEach(scanDir);

console.log("\n🎉 Naming migration complete!");
console.log("Backups created with .bak extension.");
