"use strict";
const path          = require('path'),
      menubar       = require('menubar'),
      BrowserWindow = require('browser-window'),
      ipc           = require("electron").ipcMain

const index          = `file://${__dirname}/app.html`,
      disconnectIcon = `file://${__dirname}/img/IconRed.png`

//Electron窗体配置
const mainWindow = menubar({
  width:  700,
  height: 300,
  index:  index,
  icon:   disconnectIcon
})

var win
//防止 Chromium 降低隐藏的渲染进程优先级
mainWindow.app.commandLine.appendSwitch('disable-renderer-backgrounding')

//页面加载完毕事件
mainWindow.on('ready', ()=> {
  console.log('页面加载完毕！')
})

//监听icon事件
ipc.on('icon', (ev, key)=> {
  let icon = null;
  switch(key){
    case 'connected':    icon = `${__dirname}/img/IconRed.png`; break;
    case 'disconnected': icon = `${__dirname}/img/IconRed.png`; break;
    default: console.log(`[icon]收到未知信号！`)
  }
  mainWindow.tray.setImage(icon)
});

//监听结束事件
ipc.on('terminate', (ev)=> {
  mainWindow.app.quit()
});

//监听改变窗口大小事件
ipc.on('resize', (ev, data)=> {
  mainWindow.window.setSize(data.width, data.height)
});

//监听发生错误事件
ipc.on('error', (ev, err)=> {
  console.error(new Error(err.message))
});

//监听创建窗口事件
ipc.on('create-window', (ev, config)=> {
  console.log('窗口新窗口', [config]);
  mainWindow.app.dock.show(); //显示应用在 dock 中的图标[MAC]
  win = new BrowserWindow({width: 720, height: 445}); //创建新窗口
  win.loadURL(`file://${__dirname}/screen.html`);

  win.on('closed', ()=> {
    mainWindow.app.dock.hide(); //隐藏应用在 dock 中的图标。[MAC]
    mainWindow.window.webContents.send('disconnected', true); //发送连接关闭消息
  });

  ipc.once('window-ready', function () {
    // win.webContents.openDevTools()
    win.webContents.send('peer-config', config)
  })

  ipc.on('connected', function () {
    mainWindow.window.webContents.send('connected', true)
  })

  ipc.on('disconnected', function () {
    mainWindow.window.webContents.send('disconnected', true)
  })

  ipc.on('show-window', function () {
    win.show()
  })

  ipc.on('stop-viewing', function () {
    win.close()
    mainWindow.window.webContents.send('disconnected', true)
  })
})
