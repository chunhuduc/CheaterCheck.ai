const { request } = require('http');
const { request: reqHttps } = require('https');
const { URL } = require('url');

const rawUrl = process.env.HARPERDB_URL || 'http://localhost:9925';
const timeoutSec = Number(process.env.WAIT_TIMEOUT || 60);
const intervalMs = 1000;
const deadline = Date.now() + timeoutSec * 1000;

function checkOnce(url) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname || '/',
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        timeout: 5000,
      };

      const r = (u.protocol === 'https:' ? reqHttps : request)(opts, (res) => {
        // any 2xx or 3xx considered OK
        if (res.statusCode && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
        res.resume();
      });

      r.on('error', () => resolve(false));
      r.on('timeout', () => {
        r.destroy();
        resolve(false);
      });
      r.end();
    } catch (err) {
      resolve(false);
    }
  });
}

(async () => {
  console.log(`Waiting for HarperDB at ${rawUrl} (timeout ${timeoutSec}s)...`);
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkOnce(rawUrl);
    if (ok) {
      console.log('HarperDB is up and responding.');
      process.exit(0);
    }
    // wait
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  console.error(`Timeout waiting for HarperDB at ${rawUrl}.`);
  process.exit(1);
})();
