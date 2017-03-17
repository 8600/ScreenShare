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
      console.error(`发生错误：${err}`);
      return;
    }
    if (!room) {
      console.error(`发生错误：房间不存在`);
      return;
    }
    peer.on('stream', function (stream) { renderStreams(peerConnection, stream); });
    peer.on('signal', function (sdp) {
      peerConnection.handleSignal(sdp, peer, true, room);
    });
    if (peer.connected) {peerConnection.onConnect(peer, true);}
    else {peer.on('connect', function () { peerConnection.onConnect(peer, true) ;});}
  });
};

module.exports.host = function (peerConnection, opts={}) {
  //向服务器获取房间
  peerConnection.createRoom(function (err, room) {
    if (err) {console.log(`出现错误:${err}`);return null;}
    console.log(`创建房间${room}`);
    opts.room = room;
    peerConnection.hostPeer(opts, function (err, peer) {
      console.log("执行回掉函数",peer);
      if (err) { console.error(err); return; }
      if (!room) { console.error("发生错误:房间不存在");return; }

      peer.on('stream', function (stream) { renderStreams(peerConnection, stream); });

      peer.on('signal', function (sdp) {
        console.log("收到P2P信号");
        console.log("SDP:",sdp);
        console.log("Peer:",peer);
        console.log("Room:",room);
        peerConnection.handleSignal(sdp, peer, false, room);
      });

      if (peer.connected) {
        console.log("P2P连接成功");
        peerConnection.onConnect(peer, false);
      }
      else {
        peer.on('connect', function () { 
          console.log("P2P已连接");
          peerConnection.onConnect(peer, false); 
        });
      }
    });
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