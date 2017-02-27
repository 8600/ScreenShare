"use strict";
var lobby = require('./index.js')();
var port = process.argv[2] || process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 5005;
var ip = process.env.OPENSHIFT_NODEJS_IP;

lobby.listen(port, ip, function listening (err) {
  if (err) {throw err;}
  console.log('正在监听端口:', port);
});
