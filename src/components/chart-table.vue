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

import { charts } from './../store/main';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/first';

import { DVChart } from './../classes/chart';
import {
    chartRenderedSubject,
    chartTableCreatedSubject,
    chartViewDataClickedSubject,
    ChartViewDataClickEventType
} from './../observable-bus';

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
    isTableRendered: boolean = false;

    dvchart: DVChart;

    id: string = uniqid.time();

    get chartId(): string | undefined {
        const id: string = this.rootChartId || this.$attrs['dv-chart-id'];
        if (!id) {
            log.error(
                `[chart-table section='${this
                    .rootSectionId}'] table cannot be linked because it is missing a parent chart id`
            );
        }

        return id;
    }

    // TODO: deprecated; should be removed when `dv-auto-render` attribute is removed
    get autoRender(): boolean {
        return typeof this.$attrs['dv-auto-render'] !== 'undefined';
    }

    get tableClass(): string {
        return this.$attrs['dv-table-class'];
    }

    mounted(): void {
        // no chart id, no cake
        if (!this.chartId) {
            return;
        }

        // find the table container
        this.highchartsDataTable = this.$el.querySelector(
            HIGHCHARTS_DATA_TABLE_CLASS
        ) as HTMLElement;

        // when chart renders, notify it that a table is ready
        if (charts[this.chartId]) {
            this.notifyChart();
        } else {
            // when chart renders, notify it that a table is ready
            chartRenderedSubject
                .filter(event => event.id === this.chartId)
                .first()
                .subscribe(event => this.notifyChart);
        }
    }

    notifyChart() {
        // TODO: deprecated; should be removed when `dv-auto-render` attribute is removed
        if (this.autoRender) {
            chartRenderedSubject
                .filter(event => event.id === this.chartId)
                .first()
                .subscribe(() => this.renderTable(charts[this.chartId as string].highchart));
        }

        // chart.observable?
        chartViewDataClickedSubject
            .filter(
                ({ chartId, tableId = this.id, highchartObject }: ChartViewDataClickEventType) => {
                    return chartId === this.chartId && tableId === this.id;
                }
            )
            .subscribe(event => {
                this.renderTable(event.highchartObject);
            });

        chartTableCreatedSubject.next({ chartId: this.chartId as string, tableId: this.id });
    }

    renderTable(highchartObject: Highcharts.ChartObject | null = this.dvchart.highchart): void {
        // render table can only be called after the chart has been rendered
        if (!highchartObject) {
            log.warn(
                `[chart-table='${this
                    .chartId}'] something's wrong - trying to render the table before chart is ready`
            );
            return;
        }

        this.highchartsDataTable.innerHTML = (<EnhancedChartObject>highchartObject).getTable();
        if (typeof this.tableClass !== 'undefined') {
            this.highchartsDataTable.querySelector('table')!.classList.add(
                ...this.tableClass.split(' ')
            );
        }
        this.isTableRendered = true;
    }
}
</script>

<style lang="scss" scoped>

</style>


