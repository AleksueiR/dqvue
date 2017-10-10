<template>
    <div>
        charts !!!
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
export default class Chart extends Vue {
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

</style>