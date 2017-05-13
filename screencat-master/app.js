"use strict";
/* global screen */
const ipc = require('ipc'),
      clipboard = require('clipboard'),
      shell = require('shell'),
      desktopCapturer = require('desktop-capturer'),
      domify = require('domify'),
      mdns = require('multicast-dns')(), //组播库
      createPeerConnection = require('./peer.js'),
      ui = require('./ui.js'),
      connect = require('./connect.js');

var peer = null,
    peerConnection = createPeerConnection();
window.ui = ui;
window.pc = peerConnection;

mdns.on('query', (query)=> {
  console.log("收到查询请求:",query);
  if (!ui.inputs.copy.value) { return; }
  query.questions.forEach(function (q) {
    if (q.type === 'TXT' && q.name === 'screencat') {
      mdns.respond([{type: 'TXT', name: 'screencat', data: ui.inputs.copy.value}])
    }
  });
});

mdns.on('response', function (res) {
  console.log("收到回复请求:",res);
  res.answers.forEach(function (a) {
    if (a.type === 'TXT' && a.name === 'screencat') {
      ui.buttons.mdns.innerText = a.data
      ui.show(ui.containers.mdns)
    }
  })
})

peerConnection.on('connected', function connected (newPeer, remote) {
  console.log("链接已建立")
  peer = newPeer;
  if (!remote) {
    //更换连接状态图标
    ipc.send('icon', 'connected')
    ui.show(ui.containers.sharing)
    ui.hide(ui.containers.content)
  } else {
    ui.show(ui.containers.multimedia)
    ui.hide(ui.containers.content)
  }

  peer.on('error', (err)=> {
    ipc.send('icon', 'disconnected');
    console.error('peer error');
    console.error(err);
    ui.containers.content.innerHTML = 'Error connecting! Please Quit. ' + err.message;
  });

  peer.on('close', ()=> {
    //恢复默认图标
    ipc.send('icon', 'disconnected')
    showChoose();
  });
});

ipc.on('connected', ()=> {
  console.log("成功建立IPC连接！")
  ui.hide(ui.containers.content)
  ui.show(ui.containers.viewing)
})

ipc.on('disconnected', ()=> {
  console.log("IPC连接结束")
  showChoose();
})

//退出应用事件
ui.buttons.quit.addEventListener('click', (e)=> {
  ipc.send('terminate')
});

//挂断连接
ui.buttons.destroy.addEventListener('click', (e)=> {
  if (peer) {peer.destroy();}
  showChoose();
})

ui.buttons.share.addEventListener('click', (e)=> {
  const sourcesList = document.querySelector('.capturer-list')
  sourcesList.innerHTML = '';
  ui.hide(ui.containers.choose)
  ui.show(ui.buttons.back)
  try {
    if (!peerConnection.robot) {peerConnection.robot = require('./robot.js')}
  } catch (e) {
    error(new Error('./robot.js 加载失败'));
    error(e)
  }
  //获取屏幕资源
  desktopCapturer.getSources({types: ['window', 'screen']}, function (err, sources) {
    if (err) {return error(err);}
    ui.hide(ui.containers.choose);
    ui.show(ui.containers.capturer);
    let id = 0
    sources.forEach(function (source) {
      const thumb = source.thumbnail.toDataUrl(),
            title = source.name.slice(0, 20),
            item = `<li><a href="#"><img src="${thumb}"><span>${title}</span></a></li>`;
      if (!thumb) { return; }
      sourcesList.appendChild(domify(item));
      id++;
    });
    const links = sourcesList.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].onclick = closure(i);
    }

    function closure (i) {
      return function (e) {
        e.preventDefault()
        const source = sources[i]
        const opts = {
          constraints: {
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                maxWidth: screen.availWidth,
                maxHeight: screen.availHeight,
                maxFrameRate: 25
              }
            }
          }
        }
        ui.show(ui.containers.share);
        ui.hide(ui.containers.capturer);
        sourcesList.innerHTML = '';
        connect.host(peerConnection, ui, opts);
        return false;
      }
    }
  })
})

ui.buttons.mdns.addEventListener('click', function (e) {
  ui.inputs.paste.value = ui.buttons.mdns.innerText.trim();
  ui.buttons.paste.click();
})

ui.buttons.join.addEventListener('click', function (e) {
  ui.inputs.copy.value = '';
  ui.hide(ui.containers.mdns);
  ui.show(ui.containers.join);
  ui.hide(ui.containers.choose);
  ui.show(ui.buttons.back);

  var interval = setInterval(query, 1000);
  query();

  connect.verifyUserRoom(peerConnection, ui, function (err, room, config) {
    clearInterval(interval)
    if (err) {
      ui.inputs.paste.value = 'Error! ' + err.message;
      return;
    }
    ui.inputs.paste.value = 'Waiting on other side...';
    ipc.send('create-window', {config: config, room: room});
  });

  function query () {
    mdns.query([{type: 'TXT', name: 'screencat'}]);
  }
})

ui.buttons.back.addEventListener('click', function (e) {
  // HACK do a clone-swap to remove listeners
  var el = ui.buttons.paste;
  var elClone = el.cloneNode(true);
  el.parentNode.replaceChild(elClone, el);
  ui.buttons.paste = elClone;

  showChoose();
})

ui.buttons.copy.addEventListener('click', function (e) {
  e.preventDefault();
  clipboard.writeText(ui.inputs.copy.value);
})

ui.buttons.show.addEventListener('click', function (e) {
  e.preventDefault();
  ipc.send('show-window');
})

ui.buttons.stopViewing.addEventListener('click', function (e) {
  e.preventDefault();
  ipc.send('stop-viewing');
})

function showChoose () {
  ui.hide(ui.containers.viewing);
  ui.hide(ui.containers.sharing);
  ui.hide(ui.containers.multimedia);
  ui.show(ui.containers.content);
  ui.show(ui.containers.choose);
  ui.hide(ui.containers.share);
  ui.hide(ui.containers.join);
  ui.hide(ui.buttons.back);
  ui.hide(ui.containers.capturer);
}

var externalLinks = document.querySelectorAll('.open-externally')
for (var i = 0; i < externalLinks.length; i++) {
  externalLinks[i].onclick = (e)=> {
    e.preventDefault();
    shell.openExternal(e.target.href);
    return false;
  }
}

function error (e) {
  // TODO: Display this as a site flash in addition to the app console
  ipc.send('error', {message: e.message, name: e.name});
  console.error(e);
}
