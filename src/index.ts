#!/usr/bin/env node

// Refuse to run on Node releases that still ship the vulnerable Brotli decoder
// (CVE-2026-111497). Node 18 and 20 are end-of-life and will never be patched.
// `engines` in package.json only warns, so enforce it here before loading anything.
const MIN_NODE = [22, 23, 4];
const nodeVersion = process.versions.node.split('.').map(Number);
let nodeTooOld = false;
for (let i = 0; i < MIN_NODE.length; i++) {
  const actual = nodeVersion[i] ?? 0;
  if (actual > MIN_NODE[i]) break;
  if (actual < MIN_NODE[i]) {
    nodeTooOld = true;
    break;
  }
}
if (nodeTooOld) {
  process.stderr.write(
    `cardano-mcp requires Node.js >= ${MIN_NODE.join('.')} (CVE-2026-111497 Brotli fix); ` +
      `found ${process.versions.node}. Upgrade Node and try again.\n`,
  );
  process.exit(1);
}

// Handle setup command before importing heavy dependencies
if (process.argv[2] === 'setup') {
  import('./cli/setup.js');
} else {
  import('./server.js');
}
