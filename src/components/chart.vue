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

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

import api from './../api/main';
import { DVChart } from './../classes/chart';
import { charts } from './../store/main';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

const DV_CHART_CONTAINER_ELEMENT = '[dv-chart-container]';
const DV_CHART_TABLE_CONTAINER_ELEMENT = '[dv-chart-table-container]';

export type RenderedEventType = { chartId: string; highchartObject: Highcharts.ChartObject };
export type ViewDataClickedEventType = { chartId: string };

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
    private static _rendered: Subject<RenderedEventType> = new Subject<RenderedEventType>();
    static rendered = Chart._rendered.asObservable();

    private static _viewDataClicked: Subject<ViewDataClickedEventType> = new Subject<
        ViewDataClickedEventType
    >();
    static viewDataClicked = Chart._viewDataClicked.asObservable();

    dvchart: DVChart;
    isLoading: boolean = true;

    highchartObject: Highcharts.ChartObject;

    private _chartContainer: HTMLElement;
    private _viewDataExportOption: EnhancedMenuItem | null = null;

    @Inject() rootSectionId: string;

    @Provide() rootChartId: string = this.id;

    get id(): string {
        return this.$attrs.id;
    }

    get autoGenerateTable(): boolean {
        return typeof this.$attrs['dv-auto-generate-table'] !== 'undefined';
    }

    created(): void {
        // section is created programmatically and template is missing `id` on a `<dv-chart>` node making it impossible to link in the chart's config
        if (!this.id) {
            log.error(`[chart='?'] missing 'id' attribute in [section='${this.rootSectionId}']`);
            return;
        }

        // section is created programmatically and one or more charts were not added to the DVSection object
        if (!charts[this.id]) {
            log.error(`[chart='${this.id}'] is not defined in [section='${this.rootSectionId}']`);
            return;
        }

        this.dvchart = charts[this.id] as DVChart;

        // if specified, generate table as soon as the chart renders
        if (!this.autoGenerateTable) {
            this._viewDataExportOption = {
                text: '',
                onclick: () => this.simulateViewDataClick()
            };
        }
    }

    simulateViewDataClick(tableId?: string): void {
        if (!api.Highcharts.Chart.prototype.viewData) {
            log.error(`[chart='${this.id}'] export-data module required for chart data table`);
            return;
        }

        if (typeof this.highchartObject === 'undefined') {
            // error
            return;
        }

        Chart._viewDataClicked.next({ chartId: this.id });
    }

    /**
     * Does stuff.
     *
     * @function mounted
     */
    mounted(): void {
        if (!this.dvchart) {
            // if the chart view cannot be linked to a DVChart instance, destroy it
            this.$destroy();

            while (this.$el.firstChild) {
                this.$el.removeChild(this.$el.firstChild);
            }

            this.$el.parentNode!.removeChild(this.$el);
            return;
        }

        // find chart and table containers
        this._chartContainer = this.$el.querySelector(DV_CHART_CONTAINER_ELEMENT) as HTMLElement;

        this.dvchart.configUpdated
            .filter(dvchart => dvchart.id === this.id)
            .subscribe(() => this.renderChart());

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

        Chart._rendered.next({ chartId: this.id, highchartObject: this.highchartObject });

        if (this.autoGenerateTable) {
            this.simulateViewDataClick();
        }
    }
}
</script>

<style lang="scss" scoped>

</style>