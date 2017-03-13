/* global screen, EventSource */
"use strict";
const zlib = require('zlib'),
      events = require('events'),
      SimplePeer = require('simple-peer'),
      nets = require('nets'),
      getUserMedia = require('./get-user-media.js')();
let pc;
const server = 'http://localhost:5005';


function onConnect (peer, remote) {
  console.log("connected");
  pc.emit('connected', peer, remote);
  let video;
  if (remote) {
    window.addEventListener('mouseup', mouseupListener)
    window.addEventListener('keydown', keydownListener)
  }
  if (!remote) {
    peer.on('data', function (data) {
      if (!pc.robot) {return;}
      console.log(data);
      pc.robot(data);
    });
    return;
  }
  peer.on('close', function cleanup () {
    window.removeEventListener('mouseup', mouseupListener);
    window.removeEventListener('keydown', keydownListener);
  });
  function mouseupListener (e) {
    const data = getMouseData(e);
    data.click = true;
    console.log('send mouseup', data);
    peer.send(data);
  }
  function keydownListener (e) {
    e.preventDefault();
    const data = {
      keyCode: e.keyCode,
      shift: e.shiftKey,
      meta: e.metaKey,
      control: e.ctrlKey,
      alt: e.altKey
    };
    console.log('send key', data);
    peer.send(data);
  }
  function getMouseData (e) {
    let data = {};
    data.clientX = e.clientX;
    data.clientY = e.clientY;
    if (!video) {video = document.querySelector('video');}
    if (video) {
      const videoSize = video.getBoundingClientRect();
      data.canvasWidth = videoSize.width;
      data.canvasHeight = videoSize.height;
    }
    return data;
  }
}

function createRoom (cb) {
  nets({method: 'POST', uri: server + '/v1'}, function response (err, resp, body) {
    if (err) {return cb(err);}
    const room = JSON.parse(body);
    cb(null, room.name);
  });
}

  // 获取webrtc配置(ice/stun/turn)
function getRemoteConfig (cb) {
  cb(null, undefined);
}

//默认配置
const defaultConstraints = {
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'screen',
      maxWidth: screen.availWidth,
      maxHeight: screen.availHeight,
      maxFrameRate: 25
    },
    optional: []
  }
};

function inflate (data, cb) {
  data = decodeURIComponent(data.toString())
  zlib.inflate(new Buffer(data, 'base64'), cb)
}

function handleRTCErr (err, cb) {
  if (err.name === 'PermissionDeniedError') {
    console.error('没有权限');
    console.error(err);
    cb(new Error('没有权限分享屏幕'));
  } else {
    console.error('未知错误', err);
    cb(err);
  }
}

function hostPeer (opts, cb) {
  const room = opts.room,
        config = opts.config,
        constraints = opts.constraints || defaultConstraints;
  let   peer;
  // 监听 pongs
  const events = new EventSource(server + '/v1/' + room + '/pongs');
  events.onmessage = function onMessage (e) {
    console.log('pongs onmessage', e.data);
    let row;
    try {
      row = JSON.parse(e.data);
    } catch (e) {
      return cb(new Error('Error connecting. Please start over.'));
    }
    // other side is ready
    if (row.ready) {
      connect(row.data);
    }
    // sdp from other side
    if (row.data) {
      inflate(row.data, function inflated (err, stringified) {
        if (err) {
          return cb(new Error('Error connecting. Please start over.'));
        }
        peer.signal(JSON.parse(stringified.toString()))
      });
      events.close();
    }
    
    function connect (pong) {
      // screensharing
      getUserMedia(constraints, function (videoStream) {
        // audio
        getUserMedia({audio: true, video: false}, function (audioStream) {
          peer = new SimplePeer({ initiator: true, trickle: false, config: config })
          peer._pc.addStream(videoStream);
          peer._pc.addStream(audioStream);
          pc.emit('waiting-for-peer');
          cb(null, peer);
        }, function (err) { handleRTCErr(err, cb); });
      }, function (err) { handleRTCErr(err, cb); });
    }
  };
  
  events.onerror = function onError (e) {
    cb(e);
    events.close();
  };
}

module.exports = function create () {
  pc = new events.EventEmitter();
  pc.onConnect = onConnect;
  pc.createRoom = createRoom;
  pc.hostPeer = hostPeer;
  pc.getRemoteConfig = getRemoteConfig;
  return pc;
};
