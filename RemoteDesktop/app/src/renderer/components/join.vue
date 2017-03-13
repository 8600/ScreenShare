<template lang="pug">
.box.join-box
    .input-box
        input(type="text",v-model="text")
        .ok(v-on:click.stop="join") 加入
</template>

<script>
    const desktopCapturer = require('electron').desktopCapturer,
          createPeerConnection = require('./js/peer.js'),
          mdns = require('multicast-dns')(),
          connect = require('./js/connect.js'),
          peerConnection = createPeerConnection();
    export default {
        data(){
            return{
                windowList: {},
                sources:{},
                text:""
            }
        },
        created:function(){
            const _this=this;
            mdns.on('query', function (query) {
                query.questions.forEach(function (q) {
                    if (q.type === 'TXT' && q.name === 'screencat') {
                        console.log(query)
                        // mdns.respond([{type: 'TXT', name: 'screencat', data: ui.inputs.copy.value}])
                    }
                });
            });
            mdns.on('response', function (res) {
                //console.log(res)
            });
            //const interval = setInterval(query, 30000)
            console.log(peerConnection)
            query()
            connect.verifyUserRoom(peerConnection, function (err, room, config) {
                console.log("sd");
                clearInterval(interval)
                if (err) {
                    console.log(`Error${err.message}`)
                    return
                }
                console.log(`Waiting on other side...`)
                ipc.send('create-window', {config: config, room: room})
            })
            function query () {
                mdns.query([{type: 'TXT', name: 'screencat'}])
            }
        },
        methods:{
            join(){
                // if (!room) return
                // peerConnection.verifyRoom(room, function (err) {
                //     cb(err, room, config)
                // })
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