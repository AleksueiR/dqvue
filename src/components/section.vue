<template>
    <div dv-section>
        <slot></slot>
    </div>
</template>

<script lang='ts'>

import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';

@Component
export default class Section extends Vue {
    msg = 'Hello world!!';
    count = 0;

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted() {
        // console.log('section', this.$data);

        const handle = setInterval(() =>
            (this.count += 3),
            1000);
    }
};

</script>

<style lang="scss" scoped>

</style>