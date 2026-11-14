/**
 * @fileoverview A minimal static file server for the built site, so the
 * browser tests need neither Browser-Sync nor a running dev server.
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8'
};

/**
 * Resolve a request path to a file inside the root, or null.
 * @param {string} root - Absolute directory being served
 * @param {string} pathname - URL pathname
 * @returns {string|null} Absolute file path
 */
const resolveFile = (root, pathname) => {
  const candidate = normalize(join(root, decodeURIComponent(pathname)));
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, 'index.html');
    return existsSync(index) ? index : null;
  }
  return existsSync(candidate) ? candidate : null;
};

/**
 * Serve a directory on an ephemeral local port.
 * @param {string} root - Absolute directory to serve
 * @returns {Promise<{origin: string, close: () => Promise<void>}>}
 */
export const serve = (root) =>
  new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const { pathname } = new URL(request.url, 'http://localhost');
      const file = resolveFile(root, pathname);
      if (!file) {
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('Not found');
        return;
      }
      response.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      createReadStream(file).pipe(response);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        origin: `http://127.0.0.1:${server.address().port}`,
        close: () =>
          new Promise((done) => {
            server.closeAllConnections();
            server.close(() => done());
          })
      });
    });
  });
