<template lang="pug">
  .box.main-box
    .title
      .bar
      .min.min-button(v-on:click.stop="minimize")
      .close.min-button(v-on:click.stop="close")
    router-view
</template>

<script>
  const ipcRenderer = require('electron').ipcRenderer;
  export default {
      methods:{
          minimize(){
              //向主进程发送最小化消息
              ipcRenderer.sendSync('main-window-message', 'minimize');
          },
          close(){
              ipcRenderer.sendSync('main-window-message', 'close');
          },
      },
  }
</script>
<style lang="less">
.main-box{
  display: flex;
  flex-direction: column;
  .title{
    height: 25px;
    width: 100%;
    background-color: cadetblue;
    display: flex;
    justify-content: flex-end;
  }
  .bar{
    height: 100%;
    width: 320px;
    -webkit-app-region: drag;
  }
  .min-button{
    height: 15px;
    width: 15px;
    border-radius: 50%;
    margin: 5px 2px;
  }
  .min{
    background-color: chartreuse;
  }
  .close{
    background-color: darkturquoise;
  }
}
</style>
<style>
html,body { height: 100%; width: 100%;background:#fff;}
.box{height: 100%; width: 100%;}
body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,code,form,fieldset,legend,input,textarea,p,blockquote,th,td{margin:0;padding:0}
img{border:0;vertical-align:top}
ol,ul{list-style:none}
caption,th{text-align:left}
a{text-decoration:none;color:#666;-webkit-user-drag: none;}
a:hover{text-decoration:none}
body {
  font-family: "Arial","Microsoft YaHei","黑体","宋体",sans-serif;
  background-position: center;
  display: flex;
  justify-content: center;
  font-size: 0.8rem;
  overflow: hidden;
}
/* 滚动条样式 */
::-webkit-scrollbar{width:14px;height: 7px;}
::-webkit-scrollbar-track{background-color:#bee1eb;}
::-webkit-scrollbar-thumb{background-color:#00aff0;}
::-webkit-scrollbar-thumb:hover {background-color:#9c3}
::-webkit-scrollbar-thumb:active {background-color:#00aff0}
</style>
