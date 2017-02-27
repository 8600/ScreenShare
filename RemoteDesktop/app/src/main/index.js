'use strict'

import { app, BrowserWindow,ipcMain  } from 'electron'

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`

function createWindow () {
  //创建聊天窗口
  mainWindow = new BrowserWindow({
    height: 150,
    width: 350,
    resizable:false,
    title:"远程桌面",
    autoHideMenuBar:true,
    frame:false,
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

//监听ipc消息
ipcMain.on('main-window-message', function(event, arg) {
  console.log(`收到IPC消息:${arg}`);
  switch (arg){
    case "minimize":mainWindow.minimize();event.returnValue = 'ok';break;
    case "close":mainWindow.close();event.returnValue = 'ok';break;
  }  
});
