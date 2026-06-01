// src/services/autoFixService.js

const { execSync } = require('child_process');
const fs = require('fs');

module.exports.applyPatchAndCommit = async function applyPatchAndCommit({
  fileName,
  patch,
  commitMessage,
}) {
  try {
    // Write patch to temp file
    const patchPath = `/tmp/${fileName}.patch`;
    fs.writeFileSync(patchPath, patch);

    // Apply patch
    execSync(`git apply ${patchPath}`);

    // Commit
    execSync(`git add ${fileName}`);
    execSync(`git commit -m "${commitMessage}"`);

    // Push
    execSync(`git push`);

    return true;
  } catch (err) {
    console.error('Auto‑Fix failed:', err);
    return false;
  }
};
