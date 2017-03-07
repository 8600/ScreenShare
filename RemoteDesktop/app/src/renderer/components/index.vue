<template lang="pug">
  .box.box-two
    router-link.self.button(to="/select") 创建分享
    router-link.other.button(to="/join") 加入分享
</template>

<style lang="less">
.box-two{
    height: 125px;
    background-color: skyblue;
    display: flex;
    justify-content: center;
    align-items: center;
    .button{
        height: 50px;
        width: 120px;
        margin: 10px;
        font-size: 1.6rem;
        line-height: 50px;
        text-align: center;
        color: lightseagreen;
    }
    .self{
        background-color: bisque;
    }
    .other{
        background-color: chartreuse;
    }
}
</style>