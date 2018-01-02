<template>
    <div dv-chart-table-container :id="id">
        <div class="highcharts-data-table"></div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import uniqid from 'uniqid';
import loglevel from 'loglevel';
import api from './../api/main';

import Chart, { RenderedEvent, ViewDataEvent } from './../components/chart.vue';
import { charts } from './../store/main';

import 'rxjs/add/operator/filter';

import { DVChart } from './../classes/chart';

const log: loglevel.Logger = loglevel.getLogger('dv-chart-table');

const HIGHCHARTS_DATA_TABLE_CLASS = '.highcharts-data-table';

// `getTable` is not included in default Highcharts types
interface EnhancedChartObject extends Highcharts.ChartObject {
    getTable: () => string;
}

@Component
export default class ChartTable extends Vue {
    @Inject() rootSectionId: string;
    @Inject() rootChartId: string;

    highchartsDataTable: HTMLElement;

    id: string = uniqid.time();
    dvchart: DVChart;

    get chartId(): string {
        return this.rootChartId || this.$attrs['dv-chart-id'];
    }

    // TODO: deprecated; should be removed when `dv-auto-render` attribute is removed
    get autoRender(): boolean {
        return typeof this.$attrs['dv-auto-render'] !== 'undefined';
    }

    get tableClass(): string {
        return this.$attrs['dv-table-class'];
    }

    created(): void {
        if (!this.chartId) {
            log.error(
                `[chart-table='${this.id}' section='${this
                    .rootSectionId}'] table cannot be linked because it is missing a parent chart id`
            );
        }

        if (!charts[this.chartId]) {
            log.error(
                `[chart-table='${this.id}' chart='${this.chartId}' section='${this
                    .rootSectionId}'] referenced chart does not exist`
            );
            return;
        }

        this.dvchart = charts[this.chartId] as DVChart;
    }

    mounted(): void {
        // no chart id, no cake
        if (!this.dvchart) {
            this.$destroy();

            while (this.$el.firstChild) {
                this.$el.removeChild(this.$el.firstChild);
            }

            this.$el.parentNode!.removeChild(this.$el);
            return;
        }

        // find the table container
        this.highchartsDataTable = this.$el.querySelector(
            HIGHCHARTS_DATA_TABLE_CLASS
        ) as HTMLElement;

        if (this.dvchart.isTableGenerated) {
            this.generateTable();
        }

        // --- TODO: deprecated; should be removed when `dv-auto-render` attribute is removed
        if (this.autoRender) {
            Chart.rendered
                .filter((event: RenderedEvent) => event.chartId === this.chartId)
                .subscribe(() => this.generateTable());
        }
        // ---

        Chart.viewData
            .filter((event: ViewDataEvent) => {
                return event.chartId === this.chartId;
            })
            .subscribe(() => this.generateTable());
    }

    generateTable(): void {
        // render table can only be called after the chart has been rendered
        if (!this.dvchart.highchart) {
            log.warn(
                `[chart-table='${this.id}' chart='${this
                    .chartId}'] something's wrong - trying to render the table before chart is ready`
            );
            return;
        }

        this.highchartsDataTable.innerHTML = (<EnhancedChartObject>this.dvchart
            .highchart).getTable();

        // if custom css classes are specified for the table, apply them onto the node
        if (typeof this.tableClass !== 'undefined') {
            this.highchartsDataTable.querySelector('table')!.classList.add(
                ...this.tableClass.split(' ')
            );
        }

        log.info(
            `[chart-table='${this.id}' chart='${this.chartId}'] rendering chart table on`,
            this.highchartsDataTable
        );
    }
}
</script>

<style lang="scss" scoped>

</style>


