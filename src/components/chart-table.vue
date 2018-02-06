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

import {
    chartRendered,
    chartViewData,
    ChartEvent,
    ChartRenderedEvent,
    ChartViewDataEvent
} from './../observable-bus';

import { charts } from './../store/main';

import 'rxjs/add/operator/filter';

import { DVChart } from './../classes/chart';

const log: loglevel.Logger = loglevel.getLogger('dv-chart-table');

const HIGHCHARTS_DATA_TABLE_CLASS = '.highcharts-data-table';

@Component
export default class ChartTable extends Vue {
    readonly logMarker: string = `[chart-table='${this.id}' chart='${this.chartId}' section='${
        this.rootSectionId
    }']`;

    @Inject() rootSectionId: string;
    @Inject() rootChartId: string;

    highchartsDataTable: HTMLElement;

    id: string = uniqid.time();
    dvchart: DVChart;

    get chartId(): string {
        return this.rootChartId || this.$attrs['dv-chart-id'];
    }

    // --- TODO: deprecated; should be removed when `dv-auto-render` attribute is removed
    get autoRender(): boolean {
        return typeof this.$attrs['dv-auto-render'] !== 'undefined';
    }
    // ---

    get tableClass(): string {
        return this.$attrs['dv-table-class'];
    }

    created(): void {
        if (!this.chartId) {
            log.error(
                `${this.logMarker} table cannot be linked because it is missing a parent chart id`
            );
        }

        if (!charts[this.chartId]) {
            log.error(`${this.logMarker} referenced chart does not exist`);
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
            chartRendered.filter(this._filterStream, this).subscribe(this.generateTable);
        }
        // ---

        chartViewData.filter(this._filterStream, this).subscribe(this.generateTable);
    }

    generateTable(): void {
        // render table can only be called after the chart has been rendered
        if (!this.dvchart.highchart) {
            log.warn(
                `${
                    this.logMarker
                } something's wrong - trying to render the table before chart is ready`
            );
            return;
        }

        // presence of data-export is checked in chart.vue - assume `getTable` is defined
        this.highchartsDataTable.innerHTML = this.dvchart.highchart.getTable!();

        // if custom css classes are specified for the table, apply them onto the node
        if (typeof this.tableClass !== 'undefined') {
            this.tableClass.split(' ').forEach(element => {
                this.highchartsDataTable.querySelector('table')!.classList.add(element);
            });
        }

        log.info(`${this.logMarker} rendering chart table on`, this.highchartsDataTable);
    }

    private _filterStream(event: ChartEvent): boolean {
        return event.chartId === this.chartId;
    }
}
</script>

<style lang="scss" scoped>

</style>
