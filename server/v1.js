"use strict";
const duplex = require('duplexify'),
      ssejson = require('ssejson'),
      pumpify = require('pumpify');

module.exports = function (state, utils) {
  function createHandler (req, res, opts, cb) {
    if (req.method !== 'POST') {
      const err = new Error('仅支持Post请求');
      err.statusCode = 405;
      return cb(err);
    }
    const room = utils.makeName();
    console.log(`创建房间:${room}`);
    res.setHeader('content-type', 'application/json');
    res.statusCode = 201;
    res.end(JSON.stringify({name: room}));
    state.pings[room] = ssejson.serialize({});
    state.pongs[room] = ssejson.serialize({});

    const tId = setTimeout(function expire () {
      // TODO dont delete if being used
      destroy(room);
    }, 1000 * 60); // 30 mins
    state.timeouts.push(tId);
    console.log(`创建房间${room}`);
  }

  function pingHandler (req, res, opts, cb) {
    upload('pings', req, res, opts, function uploaded (err, room, data) {
      if (err) { cb(err); return; }
      console.log(`[${room}]:Ping`);
      state.pings[room].write(data);
      res.end();
    });
  }

  function pongHandler (req, res, opts, cb) {
    upload('pongs', req, res, opts, function uploaded (err, room, data) {
      if (err) {cb(err);return;}
      console.log(`[${room}]:Pong`);
      state.pongs[room].write(data);
      res.end();
    });
  }

  function pingsHandler (req, res, opts, cb) {
    const room = opts.params.name;
    const events = state.pings[room];
    console.log(`[${room}]:Pings`);
    subscribe(events, req, res, opts, cb);
  }

  function pongsHandler (req, res, opts, cb) {
    const room = opts.params.name;
    const events = state.pongs[room];
    console.log(`[${room}]:Pongs`);
    subscribe(events, req, res, opts, cb);
  }

  function upload (type, req, res, opts, cb) {
    if (req.method !== 'POST') {
      const err = new Error('仅支持Post请求');
      err.statusCode = 405;
      return cb(err);
    }

    const room = opts.params.name;
    if (!room || (Object.keys(state[type]).indexOf(room) === -1)) {
      const error = new Error('房间不存在或者过期！');
      error.statusCode = 404;
      return cb(error);
    }

    const uploader = utils.uploadStream(function uploaded (buff) {
      try {const data = JSON.parse(buff);cb(null, room, data);} 
      catch(e) {cb(e);}
    });
    pumpify(req, uploader).on('error', cb);
  }

  function subscribe (events, req, res, opts, cb) {
    if (!events) {
      var err = new Error('房间不存在或者过期！');
      err.statusCode = 404;
      cb(err);
      return;
    }
    res.setHeader('content-type', 'text/event-stream');
    var readable = duplex();
    readable.setReadable(events);
    pumpify(readable, res).on('error', cb);
  }
  //清理房间
  function destroy (room) {
    finish(state.pings, room);
    finish(state.pongs, room);
    console.log(`房间${room}已清理！`);
    function finish (list, room) {
      if (Object.keys(list).indexOf(room) > -1) {
        list[room].on('finish', function () {
          delete list[room];
        });
        list[room].destroy();
      }
    }
  }

  return {
    create: createHandler,
    ping: pingHandler,
    pong: pongHandler,
    pings: pingsHandler,
    pongs: pongsHandler
  };
};
