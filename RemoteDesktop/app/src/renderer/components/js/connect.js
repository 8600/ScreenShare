"use strict";
module.exports.verifyUserRoom = function (peerConnection, cb) {
  peerConnection.getRemoteConfig(function (err, config) {
    if (err) {return cb(err);}

    function onJoinClick (ev) {
      ev.preventDefault();
      var room = ui.inputs.paste.value;
      if (!room) {return;}
      peerConnection.verifyRoom(room, function (err) {
        cb(err, room, config);
      });
    }
  });
};

module.exports.remote = function (peerConnection, config, room) {
  peerConnection.remotePeer(config, room, function (err, peer) {
    if (err) {
      ui.inputs.paste.value = 'Error! ' + err.message;
      return;
    }

    if (!room) {
      ui.inputs.paste.value = 'Error! Please Quit';
      return;
    }

    peer.on('stream', function (stream) { renderStreams(peerConnection, stream); });

    peer.on('signal', function (sdp) {
      peerConnection.handleSignal(sdp, peer, true, room, function (err) {
        if (err) {
          ui.containers.content.innerHTML = 'Error! Please Quit. ' + err.message;
          return;
        }
        console.log('SDP POST DONE')
      });
    });

    if (peer.connected) {peerConnection.onConnect(peer, true);}
    else {peer.on('connect', function () { peerConnection.onConnect(peer, true) ;});}
  });
};

module.exports.host = function (peerConnection, opts={}) {
  getARoom(peerConnection, function (err, room, config) {
    if (err) {console.log(`出现错误:${err}`);return null;}
    console.log(`创建房间${room}`);
    opts.room = room;
    opts.config = config;
  });
};

function renderStreams (peerConnection, stream) {
  stream.getAudioTracks().forEach(function each (track) {
    var audio = peerConnection.audioElement(stream);
  });
  stream.getVideoTracks().forEach(function each (track) {
    var video = peerConnection.videoElement(stream);
  });
}

//获取房间
function getARoom (peerConnection, cb) {
  peerConnection.createRoom(function (err, room) {
    cb(err, room, null);
  });
}
