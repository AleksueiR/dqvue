<template>
    <div dv-chart>
        charts !!! {{ id }}
    </div>
</template>

<script lang='ts'>

import Vue from 'vue';
import { Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';

@Component
export default class Chart extends Vue {
    msg = 'Hello world!!';
    count = 0;

    @Inject() charts: { [name: string]: object }

    get id(): string {
        return this.$attrs.id;
    }

    get config(): { config: object } {
        return this.charts[this.id] as { config: object };
    }

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted() {
        this.$watch(() => this.config.config, (newVal, oldVal) => {
            console.log('watch', newVal, oldVal);
        }, { deep: true })

        console.log('chart'); // , this.$parent, this.charts);
        console.log(this.config)


        const handle = setInterval(() =>
            (this.count += 3),
            1000);
    }
};

</script>

<style lang="scss" scoped>

</style>