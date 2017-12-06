<template>
    <div dv-chart-table-container>
        <div class="highcharts-data-table"></div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';
import api from './../api/main';

import 'rxjs/add/operator/filter';

import { DVChart } from './../classes/chart';
import {
    chartConfigUpdatedSubject,
    chartRenderedSubject,
    chartTableCreatedSubject
} from './../observable-bus';

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

    get autoRender(): boolean {
        return typeof this.$attrs['dv-auto-render'] !== 'undefined';
    }

    get tableClass(): string {
        return this.$attrs['dv-table-class'];
    }

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
        chartTableCreatedSubject.next({
            id: this.rootChartId,
            renderer: () => this.renderTable()
        });

        chartRenderedSubject
            .filter(
                event => event.id === this.rootChartId && (this.isTableRendered || this.autoRender)
            )
            .subscribe(event => {
                this.renderTable(event.highchartObject);
            });
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
        this.highchartsDataTable.querySelector('table')!.classList.add(
            ...this.tableClass.split(' ')
        );
        this.isTableRendered = true;
    }
}
</script>

<style lang="scss" scoped>

</style>


