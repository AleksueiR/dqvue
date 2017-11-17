<template>
    <div dv-chart-table-container>
        <div class="highcharts-data-table"></div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';
import api from './../api/main';

import { DVChart } from './../classes/chart';
import {
    EventBus,
    CHART_CONFIG_UPDATED,
    CHART_RENDERED,
    CHART_TABLE_PREPARED
} from './../event-bus';

const log: loglevel.Logger = loglevel.getLogger('dv-chart-table');

const HIGHCHARTS_DATA_TABLE_CLASS = '.highcharts-data-table';

// `getTable` is not included in default Highcharts types
interface EnhancedChartObject extends Highcharts.ChartObject {
    getTable: () => string;
}

@Component
export default class ChartTable extends Vue {
    @Inject() charts: { [name: string]: object };
    @Inject() rootSectionId: string;
    @Inject() rootChartId: string;

    highchartsDataTable: HTMLElement;
    isTableRendered: boolean = false;

    dvchart: DVChart;

    mounted(): void {
        if (!api.Highcharts.Chart.prototype.viewData) {
            log.error(
                `[chart-table='${this
                    .rootChartId}'] export-data module required for chart data table`
            );
            return;
        }

        // pull the chart instance provided by the section
        this.dvchart = this.charts[this.rootChartId] as DVChart;

        // find the table container
        this.highchartsDataTable = this.$el.querySelector(
            HIGHCHARTS_DATA_TABLE_CLASS
        ) as HTMLElement;

        // fire even with the table renderer function to be injected into the chart config
        EventBus.$emit(CHART_TABLE_PREPARED, {
            id: this.rootChartId,
            renderer: () => this.renderTable()
        });

        EventBus.$on(
            CHART_RENDERED,
            (event: { id: string; highchartObject: Highcharts.ChartObject }) => {
                // when the chart is re-rendered, only re-render the table if it was already rendered
                if (event.id == this.rootChartId && this.isTableRendered) {
                    this.renderTable(event.highchartObject);
                }
            }
        );
    }

    renderTable(highchartObject: Highcharts.ChartObject | null = this.dvchart.highchart): void {
        // render table can only be called after the chart has been rendered
        if (!highchartObject) {
            log.warn(
                `[chart-table='${this
                    .rootChartId}'] something's wrong - trying to render the table before chart is ready`
            );
            return;
        }

        this.highchartsDataTable.innerHTML = (<EnhancedChartObject>highchartObject).getTable();
        this.isTableRendered = true;
    }
}
</script>

<style lang="scss" scoped>

</style>


