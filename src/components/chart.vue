<template>
    <div dv-chart :class="{ loading: isLoading }"></div>
</template>

<script lang='ts'>

import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';

import * as Highcharts from 'highcharts';

import { DVChart } from './../classes/chart';
import { EventBus, CHART_CONFIG_UPDATED } from './../event-bus';

@Component
export default class Chart extends Vue {
    dvchart: DVChart;
    isLoading: boolean = true;

    @Inject() charts: { [name: string]: object }

    get id(): string {
        return this.$attrs.id;
    }

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted(): void {
        EventBus.$on(CHART_CONFIG_UPDATED, ({ id, config }: DVChart) => {
            if (id == this.id) {
                this.bootChart();
            }
        });

        this.dvchart = this.charts[this.id] as DVChart;
        if (this.dvchart.isConfigValid) {
            this.bootChart();
        }
    }

    bootChart(): void {
        console.log('chart booting');

        Highcharts.chart(this.$el, this.dvchart.config as Highcharts.Options);
        this.isLoading = false;
    }
};

</script>

<style lang="scss" scoped>

/* [dv-chart].loading {
    height: 100px;
    border: 1px solid grey;
} */

</style>