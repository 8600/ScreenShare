"use strict";
const lobby = require('./index.js')();
const port = process.argv[2] || process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 5005;
const ip = process.env.OPENSHIFT_NODEJS_IP;

lobby.listen(port, ip, function listening (err) {
  if (err) {throw err;}
  console.log('Listening on', port);
});
