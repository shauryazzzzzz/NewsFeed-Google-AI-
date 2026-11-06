// test.mjs — NewsFeed-Google-AI- backend tests
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const BASE = 'http://localhost:3002';
let server;
let pass = 0, fail = 0;

async function check(label, url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    if (r.ok) { console.log(`  PASS  ${label} (${r.status})`); pass++; }
    else       { console.log(`  FAIL  ${label} (${r.status})`); fail++; }
  } catch (e) { console.log(`  FAIL  ${label} (${e.message})`); fail++; }
}

console.log('\n=== NewsFeed-Google-AI- Tests ===');
server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server.ts'], { cwd: process.cwd(), env: { ...process.env, PORT: '3002' }, stdio: 'ignore' });
await sleep(6000);

await check('GET /api/config',             `${BASE}/api/config`);
await check('GET /api/news-tree (any)',    `${BASE}/api/news-tree`);
await check('GET / (frontend)',            `${BASE}/`);

server.kill();
console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
