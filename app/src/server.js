'use strict';

// Intentionally trivial, zero-dependency HTTP service.
// The value of arcanex is the supply-chain pipeline around this file,
// not the file itself. Keep it boring and dependency-free (see ADR-004).

const http = require('node:http');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(
    JSON.stringify({
      service: 'arcanex',
      message: 'signed, attested, and running',
      version: process.env.APP_VERSION || 'dev',
    }),
  );
});

server.listen(PORT, HOST, () => {
  console.log(`arcanex listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown so the container stops cleanly on SIGTERM.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  });
}
