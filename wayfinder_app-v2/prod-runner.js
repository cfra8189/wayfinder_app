// Wrapper to require built server and keep the process alive
try {
  require('./dist/server/index.js');
} catch (e) {
  console.error('Failed to start server:', e);
  process.exit(1);
}

// Prevent Node from exiting if the server does not keep the event loop alive
setInterval(() => {}, 1e6);
