<template>
    <div id="app">
        Hello, reloaded; ! -1-1- l --
        <span>{{ msg }} {{ count }}</span>
    </div>
</template>

<script lang='ts'>

import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
    props: {
        propMessage: String
    }
})

export default class App extends Vue {
    msg = 'Hello world!!';
    count = 0;

    mounted() {
        const handle = setInterval(() =>
            (this.count += 3),
            1000);
    }
}

</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>