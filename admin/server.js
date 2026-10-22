'use strict';
const { createApp } = require('./lib/app');

const port = Number(process.env.PORT) || 3000;
const { app, paths } = createApp();

// Bind to loopback only: the admin panel must never be reachable from the network.
const server = app.listen(port, '127.0.0.1', () => {
  const addr = server.address();
  console.log('Portfolio admin   : http://127.0.0.1:' + addr.port + '/admin/');
  console.log('Site (preview)    : http://127.0.0.1:' + addr.port + '/');
  console.log('Site folder       : ' + paths.siteDir);
});
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? 'Port ' + port + ' is in use. Set PORT=xxxx.' : e.message);
  process.exit(1);
});
