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
    window.addEventListener('mouseup', mouseupListener);
    window.addEventListener('keydown', keydownListener);
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
  console.log("向服务器发送消息");
  nets({method: 'POST', uri: server + '/v1'}, function response (err, resp, body) {
    if (err) {return cb(err);}
    const room = JSON.parse(body);
    console.log("从服务器收到消息");
    console.log(room);
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
  data = decodeURIComponent(data.toString());
  zlib.inflate(new Buffer(data, 'base64'), cb);
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

//和服务器连接
function connect (constraints, peer, cb) {
  console.log("开始和服务器建立连接",constraints);
  // 屏幕共享
  console.log("开始获取视频资源");
  getUserMedia(constraints, function (videoStream) {
    // audio
    console.log("开始获取音频资源");
    getUserMedia({audio: true, video: false}, function (audioStream) {
      peer = new SimplePeer({ initiator: true, trickle: false });
      peer._pc.addStream(videoStream);
      peer._pc.addStream(audioStream);
      pc.emit('等待连接成功');
      console.log("等待连接成功");
      cb(null, peer);
    }, function (err) { handleRTCErr(err, cb); });
  }, function (err) { handleRTCErr(err, cb); });
}

function hostPeer (opts, cb) {
  const room = opts.room,
        constraints = opts.constraints || defaultConstraints;
  let   peer;
  console.log("开始P2P连接");
  // 监听 pongs
  const events = new EventSource(server + '/v1/' + room + '/pongs');
  console.log(events);
  events.onmessage = function onMessage (e) {
    console.log('P2P连接成功', e.data);
    const row = JSON.parse(e.data);
    // other side is ready
    if (row.ready) {
      console.log("P2P传输就绪");
      connect(constraints, peer, cb);
    }
    // sdp from other side
    if (row.data) {
      console.log("SDP传输就绪");
      inflate(row.data, function inflated (err, stringified) {
        if (err) {
          return cb(new Error('Error connecting. Please start over.'));
        }
        peer.signal(JSON.parse(stringified.toString()));
      });
      events.close();
    }
    
    
  };
  
  events.onerror = function onError (e) {
    console.log("与服务器连接失败");
    cb(e);
    events.close();
  };
}


function deflate (data, cb) {
  // sdp is ~2.5k usually, that's too big for a URL, so we zlib deflate it
  const date = `{"type":${data.type},"sdp":${data.sdp}}`;
  zlib.deflate(date, function (err, deflated) {
    if (err) { cb(err); return;}
    var connectionString = deflated.toString('base64');
    var code = encodeURIComponent(connectionString);
    cb(null, code);
  });
}

function handleSignal (sdp, peer, remote, room, cb) {
  deflate(sdp, function deflated (err, data) {
    if (err) {cb(err);return;}
    // upload sdp
    var uploadURL = server + '/v1/' + room;
    if (remote) {uploadURL += '/pong';}
    else {uploadURL += '/ping';}
    console.log('POST', uploadURL);
    nets({method: 'POST', json: {data: data}, uri: uploadURL}, function response (err, resp, body) {
      if (err || resp.statusCode > 299) {return cb(err);}
      cb(null);
    });
  });
}

module.exports = function create () {
  pc = new events.EventEmitter();
  pc.onConnect = onConnect;
  pc.createRoom = createRoom;
  pc.hostPeer = hostPeer;
  pc.getRemoteConfig = getRemoteConfig;
  pc.handleSignal = handleSignal;
  return pc;
};
