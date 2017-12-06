<template>
    <div dv-chart :class="{ 'dv-loading': isLoading }">
        <div dv-chart-container></div>
        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';
import loglevel from 'loglevel';
import Highcharts from 'highcharts';
import deepmerge from 'deepmerge';

import 'rxjs/add/operator/filter';

import api from './../api/main';
import { DVChart } from './../classes/chart';

import {
    chartConfigUpdatedSubject,
    chartRenderedSubject,
    chartTableCreatedSubject
} from './../observable-bus';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

const DV_CHART_CONTAINER_ELEMENT = '[dv-chart-container]';
const DV_CHART_TABLE_CONTAINER_ELEMENT = '[dv-chart-table-container]';

interface EnhancedMenuItem extends Highcharts.MenuItem {
    text: string;
    onclick: (highchartObject?: Highcharts.ChartObject) => void;
}

// `menuItemDefinitions` is not included in default Highcharts exporting options types
interface EnhancedExportingOptions extends Highcharts.ExportingOptions {
    menuItemDefinitions: { [name: string]: EnhancedMenuItem | null };
}

@Component
export default class Chart extends Vue {
    dvchart: DVChart;
    isLoading: boolean = true;

    highchartObject: Highcharts.ChartObject;

    @Inject() rootSectionId: string;
    @Inject() charts: { [name: string]: object };

    @Provide() rootChartId: string = this.id;

    get id(): string {
        return this.$attrs.id;
    }

    private _chartContainer: HTMLElement;
    private _viewDataExportOption: EnhancedMenuItem | null = null;

    created(): void {
        // listen on the table-prepared event which provides a table renderer if chart table (`dv-chart-table`) is included in the template
        chartTableCreatedSubject.filter(event => event.id === this.id).subscribe(event => {
            // create a `viewData` export option with the custom table renderer provided
            // `viewData` options defaults to `null` which will hide it from the export menu
            this._viewDataExportOption = {
                text: '',
                onclick: (<any>event).renderer
            };
        });
    }

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted(): void {
        // section is created programmatically and template is missing `id` on a `<dv-chart>` node making it impossible to link in the chart's config
        if (!this.id) {
            log.error(`[chart='?'] missing 'id' attribute in [section='${this.rootSectionId}']`);
            return;
        }

        // section is created programmatically and one or more charts were not added to the DVSection object
        if (!this.charts[this.id]) {
            log.error(`[chart='${this.id}'] is not defined in [section='${this.rootSectionId}']`);
            return;
        }

        // find chart and table containers
        this._chartContainer = this.$el.querySelector(DV_CHART_CONTAINER_ELEMENT) as HTMLElement;

        chartConfigUpdatedSubject
            .filter(dvchart => dvchart.id === this.id)
            .subscribe(() => this.renderChart());

        this.dvchart = this.charts[this.id] as DVChart;
        if (this.dvchart.isConfigValid) {
            this.renderChart();
        }
    }

    renderChart(): void {
        log.info(`[chart='${this.id}'] rendering chart`);

        // merge the custom `viewData` export option into the chart config
        // if no exporting options exist, they will be created
        // if the config author has specified `viewData` export option, it will not be overwritten
        this.dvchart.config!.exporting = deepmerge.all([
            {
                menuItemDefinitions: {
                    viewData: this._viewDataExportOption
                }
            } as EnhancedExportingOptions,
            (this.dvchart.config!.exporting || {}) as Object
        ]) as Highcharts.ExportingOptions;

        this.highchartObject = api.Highcharts.chart(this._chartContainer, this.dvchart
            .config as Highcharts.Options);
        this.isLoading = false;

        chartRenderedSubject.next({ id: this.id, highchartObject: this.highchartObject });
    }
}
</script>

<style lang="scss" scoped>

</style>