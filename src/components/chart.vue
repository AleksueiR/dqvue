<template>
    <div dv-chart :class="{ 'dv-loading': isLoading }">
        <div dv-chart-container></div>
        <dv-chart-slider axis="xAxis"></dv-chart-slider>
        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';
import loglevel from 'loglevel';
import deepmerge from 'deepmerge';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

import api, { DVHighcharts } from './../api/main';
import {
    chartRendered,
    chartConfigUpdated,
    chartViewData,
    chartSetExtremes,
    ChartConfigUpdatedEvent
} from './../observable-bus';

import { DVChart } from './../classes/chart';
import { charts } from './../store/main';

import { isArray } from './../utils';

import ChartSlider from './../components/chart-slider.vue';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

const DV_CHART_CONTAINER_ELEMENT = '[dv-chart-container]';
const DV_CHART_TABLE_CONTAINER_ELEMENT = '[dv-chart-table-container]';

@Component({
    components: {
        'dv-chart-slider': ChartSlider
    }
})
export default class Chart extends Vue {
    dvchart: DVChart;
    isLoading: boolean = true;

    highchartObject: Highcharts.ChartObject;

    private _chartContainer: HTMLElement;
    private _viewDataExportOption: DVHighcharts.MenuItem | null = null;

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
        // check if data-export modules has been loaded
        if (!api.Highcharts.Chart.prototype.viewData) {
            log.error(`[chart='${this.id}'] export-data module required for chart data table`);
            return;
        }

        if (typeof this.highchartObject === 'undefined') {
            // error
            return;
        }

        // Chart._viewData.next({ chartId: this.id });
        chartViewData.next({ chartId: this.id, dvchart: this.dvchart });
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

        chartConfigUpdated
            .filter((event: ChartConfigUpdatedEvent) => event.chartId === this.id)
            .subscribe(() => this.renderChart());

        if (this.dvchart.isConfigValid) {
            this.renderChart();
        }
    }

    renderChart(): void {
        log.info(`[chart='${this.id}'] rendering chart`);

        // create a deep copy of the original config for reference
        const originalConfig: DVHighcharts.Options = deepmerge({}, this.dvchart.config);

        const originalViewDataOption: DVHighcharts.MenuItem | undefined = originalConfig.exporting
            .menuItemDefinitions.viewData!;

        // create an update snippet for the config based on the DQV options (table generation is the only one for now)
        const configUpdates: DVHighcharts.Options = {
            exporting: {
                menuItemDefinitions: {
                    viewData:
                        // if no exporting options exist (`undefined` only, `null` has meaning in chart config - hide option), an internal one will be supplied
                        // if the config author has specified `viewData` export option, it will not be overwritten
                        typeof originalViewDataOption === 'undefined'
                            ? this._viewDataExportOption
                            : originalViewDataOption
                }
            },
            // TODO: handle yAxis
            // TODO: handle multipl x axes
            // it's possible to specify several x axes for a chart
            // in this case, each axis's options needs to be overwritten separately

            /* const axes = isArray<Highcharts.AxisOptions>(originalConfig.xAxis)
                ? originalConfig.xAxis
                : [originalConfig.xAxis];

            axes.forEach((axis: Highcharts.AxisOptions) =>
                this._setExtremesHandler(event, axis.events!.setExtremes!)
            ); */
            xAxis: {
                events: {
                    setExtremes: (event: Highcharts.AxisEvent) => {
                        this._setExtremesHandler(
                            event,
                            (<Highcharts.AxisOptions>originalConfig.xAxis!).events!.setExtremes!
                        );
                    }
                }
            }
        };

        // update the original config
        const modifiedConfig: DVHighcharts.Options = deepmerge(this.dvchart.config, configUpdates);

        // create an actual Highcharts object
        this.highchartObject = api.Highcharts.chart(this._chartContainer, modifiedConfig);
        this.isLoading = false;

        // push an event into the chart rendered stream
        chartRendered.next({
            chartId: this.id,
            dvchart: this.dvchart,
            highchartObject: this.highchartObject as DVHighcharts.ChartObject
        });

        if (this.autoGenerateTable) {
            this.simulateViewDataClick();
        }
    }

    // execute the original `setExtremes` handler specified in the chart config and push a `setExtremes` event into the corresponding stream
    private _setExtremesHandler(
        event: DVHighcharts.AxisEvent,
        originalHandler: (event: DVHighcharts.AxisEvent) => void
    ): void {
        originalHandler.call(event.target, event);

        chartSetExtremes.next({
            chartId: this.id,
            dvchart: this.dvchart,
            axis: 'xAxis',
            max: event.max,
            min: event.min
        });
    }
}
</script>

<style lang="scss" scoped>

</style>
