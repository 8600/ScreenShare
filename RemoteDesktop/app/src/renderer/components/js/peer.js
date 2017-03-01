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

module.exports = function create () {
  pc = new events.EventEmitter();
  pc.onConnect = onConnect;
  pc.createRoom = createRoom;
  return pc;
};
