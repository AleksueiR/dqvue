<template>
    <div id="app">
        Hello, reloaded!
        <span>{{ msg }} {{ count }}</span>
        <div>
            <span class="test">green</span>
            <span class="test2">orange</span>
        </div>
    </div>
</template>

<script lang='ts'>

import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    props: {
        propMessage: String
    }
})

export default class App extends Vue {
    msg = 'Hello world!!';
    count = 0;

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted() {
        const handle = setInterval(() =>
            (this.count += 3),
            1000);
    }
};

</script>

<style lang="scss" scoped>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;

    span {
        color: red;
    }

    div .test {
        color: green;
    }

    .test2 {
        color: orange;
    }
}

</style>