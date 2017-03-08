<template lang="pug">
.box.join-box
    .input-box
        input(type="text")
        .ok 加入
</template>

<script>
    const desktopCapturer = require('electron').desktopCapturer,
          createPeerConnection = require('./js/peer.js'),
          mdns = require('multicast-dns')(),
          connect = require('./js/connect.js');
    export default {
        data(){
            return{
                windowList: {},
                sources:{},
                peerConnection:null
            }
        },
        created:function(){
            const _this=this;
            mdns.on('query', function (query) {
                console.log(query)
            });
            mdns.on('response', function (res) {
                console.log(res)
            });
            var interval = setInterval(query, 1000)
            query()
            connect.verifyUserRoom(peerConnection, ui, function (err, room, config) {
                console.log("sd");
                clearInterval(interval)
                if (err) {
                    ui.inputs.paste.value = 'Error! ' + err.message
                    return
                }
                ui.inputs.paste.value = 'Waiting on other side...'
                ipc.send('create-window', {config: config, room: room})
            })
            function query () {
                mdns.query([{type: 'TXT', name: 'screencat'}])
            }
        },
    }
</script>

<style lang="less">
.join-box{
    height: 125px;
    .input-box{
        height: 30px;
        display: flex;
        width: 100%;
        margin: 30px 10px;
    }
    input{
        width: 260px;
    }
    .ok{
        line-height: 30px;
        width: 60px;
        background-color: skyblue;
        text-align: center;
        color: white;
    }
}
</style>