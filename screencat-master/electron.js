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
  let icon = null 
  switch(key){
    case 'connected':    icon = `${__dirname}/img/IconRed.png`; break;
    case 'disconnected': icon = `${__dirname}/img/IconRed.png`; break;
    default: console.log(`[icon]收到未知信号！`)
  }
  mainWindow.tray.setImage(icon)
})

mainWindow.app.on('open-url', function (e, lnk) {
  console.log("mainWindow.window")
  e.preventDefault()
  console.log(mainWindow.window)
  if (mainWindow.window) mainWindow.window.webContents.send('open-url', lnk)
})

ipc.on('terminate', function terminate (ev) {
  mainWindow.app.quit()
})

ipc.on('resize', function resize (ev, data) {
  mainWindow.window.setSize(data.width, data.height)
})

ipc.on('error', function error (ev, err) {
  console.error(new Error(err.message))
})

ipc.on('create-window', function (ev, config) {
  console.log('create-window', [config])
  mainWindow.app.dock.show()
  win = new BrowserWindow({width: 720, height: 445})
  win.loadURL('file://' + path.join(__dirname, 'screen.html'))

  win.on('closed', function () {
    mainWindow.app.dock.hide()
    mainWindow.window.webContents.send('disconnected', true)
  })

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
