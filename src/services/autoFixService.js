// src/services/autoFixService.js

const fs = require('fs');
const path = require('path');
const { runGit } = require('../utils/gitExec');

module.exports.applyPatchAndCommit = async function applyPatchAndCommit({
  fileName,
  patch,
  commitMessage,
}) {
  try {
    const patchPath = path.join('/tmp', `${fileName}.patch`);
    fs.writeFileSync(patchPath, patch);

    // Apply patch
    await runGit(`git apply ${patchPath}`);

    // Commit
    await runGit(`git add ${fileName}`);
    await runGit(`git commit -m "${commitMessage}"`);

    // Push
    await runGit(`git push`);

    return true;
  } catch (err) {
    console.error('Auto‑Fix failed:', err);
    return false;
  }
};
