"use strict";
const path = require('path'),
      menubar = require('menubar'),
      BrowserWindow = require('browser-window'),
      ipc = require('ipc'),
      icons = {
          connected: path.join(__dirname, 'img', 'IconRed.png'),
          disconnected: path.join(__dirname, 'img', 'Icon.png')
      },
      mainWindows = menubar({
          width: 700,
          height: 300,
          index: 'file://' + path.join(__dirname, 'app.html'),
          icon: 'file://' + icons.disconnected
      });

let   win;

mainWindows.app.commandLine.appendSwitch('disable-renderer-backgrounding');

mainWindows.on('ready', function ready () {
  console.log('程序已启动');
});

ipc.on('icon', function (ev, key) {
  console.log(`进入活动状态！`);
  //更换任务栏图标
  mainWindows.tray.setImage(icons[key]);
});

ipc.on('terminate', function terminate (ev) {
  console.log(`点击关闭按钮`);
  mainWindows.app.quit();
});

ipc.on('resize', function resize (ev, data) {
  console.log(`改变窗口大小`);
  mainWindows.window.setSize(data.width, data.height);
});

ipc.on('error', function error (ev, err) {
  console.error(new Error(err.message));
});

ipc.on('create-window', function (ev, config) {
  console.log(`打开远程桌面窗口！`);
  //显示托盘图标
  mainWindows.app.dock.show();
  win = new BrowserWindow({width: 720, height: 445});
  win.loadUrl('file://' + path.join(__dirname, 'screen.html'));

  win.on('closed', function () {
    //隐藏托盘图标
    mainWindows.app.dock.hide();
    mainWindows.window.webContents.send('disconnected', true);
  });

  ipc.once('window-ready', function () {
    // win.webContents.openDevTools()
    console.log(`页面加载完毕！`);
    win.webContents.send('peer-config', config);
  });

  ipc.on('connected', function () {
    console.log(`连接成功！`);
    mainWindows.window.webContents.send('connected', true);
  });

  ipc.on('disconnected', function () {
    console.log(`disconnected`);
    mainWindows.window.webContents.send('disconnected', true)
  });

  ipc.on('show-window', function () {
    console.log(`显示主窗口`);
    win.show();
  });

  ipc.on('stop-viewing', function () {
    console.log(`关闭主窗口！`);
    win.close();
    mainWindows.window.webContents.send('disconnected', true);
  });
});
