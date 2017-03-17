<template lang="pug">
  ul.box-three
    li(v-for="(value, key, index) in windowList",v-on:click.stop="select(index)")
      img(v-bind:src="value")
      span {{key}}
</template>
<script>
    const desktopCapturer = require('electron').desktopCapturer,
          createPeerConnection = require('./js/peer.js'),
          mdns = require('multicast-dns')(),
          connect = require('./js/connect.js');
    let   peer;
    export default {
        data(){
            return{
                windowList: {},
                sources:{},
                peerConnection:null
            }
        },
        created:function(){
            console.log("[选择窗口]页面加载成功")
            const _this=this;
            _this.peerConnection = createPeerConnection();
            //P2P连接
            _this.peerConnection.on('connected', function connected (newPeer, remote) {
                peer = newPeer;
                console.log("P2P连接成功");
                //连接错误处理
                peer.on('error', function error (err) {
                    console.error('P2P连接发生错误')
                    console.error(err)
                })
                //关闭连接
                peer.on('close', function close () {
                    console.log("P2P连接关闭")
                })
            });
            mdns.on('query', function (query) {
                console.log(query)
            });
            mdns.on('response', function (res) {
                console.log(res)
            });
           desktopCapturer.getSources({types: ['window', 'screen']}, function (err, sources) {
               //错误处理
               if (err) return error(err)
               console.log("获取桌面资源成功")
               let id = 0,list={}
               //保存窗口信息
               _this.sources=sources
               sources.forEach(function (source) {
                   const thumb = source.thumbnail.toDataURL()
                   if (!thumb) return
                   const title = source.name.slice(0, 20)
                   list[title]=thumb;
                   id++
               })
               _this.windowList=list;
            })
        },
        methods:{
            select(index){
                //点击选择分享的窗口
                const source = this.sources[index]
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
                console.log("开始连接服务器创建房间")
                console.log(this.peerConnection)
                console.log(opts)
                //连接服务器创建房间
                connect.host(this.peerConnection, opts)
            },
        },
    }
</script>

<style lang="less">
.box-three{
    height: 125px;
    display: flex;
    background-color: aqua;
    overflow-x: auto;
    overflow-y: hidden;
    li{
        height:125px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        img{
            height:90px;
        }
    }
}
</style>