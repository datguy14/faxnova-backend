// src/utils/gitExec.js

const { exec } = require('child_process');

module.exports.runGit = function runGit(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        console.error('Git Error:', stderr);
        return reject(err);
      }
      resolve(stdout);
    });
  });
};
