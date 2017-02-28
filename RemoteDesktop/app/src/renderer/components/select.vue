<template lang="pug">
  ul.box-three
    li(v-for="(value, key) in windowList")
      a(href="#")
        img(v-bind:src="value")
        span {{key}}
</template>
<style lang="less">
.box-three{
    height: 125px;
    display: flex;
    background-color: aqua;
    overflow-x: auto;
    overflow-y: hidden;
    li{
        height:125px;
        a{
            padding: 10px;
            display: flex;
            flex-direction: column;
            img{
                height:90px;
            }
        }
    }
}
</style>
<script>
    const desktopCapturer = require('electron').desktopCapturer;

    export default {
        data(){
            return{
                windowList: {}
            }
        },
        created:function(){
           const _this=this;
           desktopCapturer.getSources({types: ['window', 'screen']}, function (err, sources) {
               //错误处理
               if (err) return error(err)
               let id = 0,list={}
               sources.forEach(function (source) {
                   console.log(_this);
                   const thumb = source.thumbnail.toDataURL()
                   if (!thumb) return
                   const title = source.name.slice(0, 20)
                   list[title]=thumb;
                   id++
                })
                _this.windowList=list;
            })
        }
    }
</script>

<style lang="less">

</style>