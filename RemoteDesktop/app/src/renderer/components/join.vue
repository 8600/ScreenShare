<template lang="pug">
.box.join-box
    .input-box
        input(type="text")
        .ok 加入
</template>

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