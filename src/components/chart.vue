<template>
    <div dv-chart :class="{ 'dv-loading': isLoading }"></div>
</template>

<script lang='ts'>

import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';
import * as loglevel from 'loglevel';
import * as Highcharts from 'highcharts';

import { DVChart } from './../classes/chart';
import { EventBus, CHART_CONFIG_UPDATED, CHART_RENDERED } from './../event-bus';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

@Component
export default class Chart extends Vue {
    dvchart: DVChart;
    isLoading: boolean = true;

    highchartObject: Highcharts.ChartObject;

    @Inject() rootSectionId: string;
    @Inject() charts: { [name: string]: object };

    get id(): string {
        return this.$attrs.id;
    }

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted(): void {
        // section is created programmatically and template is missing `id` on a `<dv-chart>` node making it impossible to link in the chart's config
        if (!this.id) {
            loglevel.error(`[chart='?'] missing 'id' attribute in [section='${this.rootSectionId}']`);
            return;
        }

        // section is created programmatically and one or more charts were not added to the DVSection object
        if (!this.charts[this.id]) {
            loglevel.error(`[chart='${this.id}'] is not defined in [section='${this.rootSectionId}']`);
            return;
        }

        EventBus.$on(CHART_CONFIG_UPDATED, ({ id, config }: DVChart) => {
            if (id == this.id) {
                this.renderChart();
            }
        });

        this.dvchart = this.charts[this.id] as DVChart;
        if (this.dvchart.isConfigValid) {
            this.renderChart();
        }
    }

    renderChart(): void {
        log.debug(`[chart='${this.id}'] rendering chart`);

        this.highchartObject = Highcharts.chart(this.$el, this.dvchart.config as Highcharts.Options);
        this.isLoading = false;

        EventBus.$emit(CHART_RENDERED, { id: this.id, highchartObject: this.highchartObject });
    }
};

</script>

<style lang="scss" scoped>

</style>