<template>
    <div dv-chart :class="{ 'dv-loading': isLoading }">
        <div dv-chart-container></div>

        <dv-chart-slider axis="xAxis" :key="buildKey" v-if="buildKey > 0 && sliderExists"></dv-chart-slider>

        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Emit, Inject, Model, Prop, Provide, Watch } from 'vue-property-decorator';
import loglevel from 'loglevel';
import deepmerge from 'deepmerge';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/takeUntil';

import api, { DVHighcharts } from '@/api/main';
import {
    chartDestroyed,
    chartRendered,
    chartConfigUpdated,
    chartViewData,
    sectionDismounted,
    chartSetExtremes,
    ChartConfigUpdatedEvent,
    SectionDismountEvent
} from '@/observable-bus';

import { DVChart } from '@/classes/chart';
import { charts } from '@/store/main';

import { isArray } from '@/utils';

import ChartSlider from '@/components/chart-slider.vue';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

const DV_CHART_CONTAINER_ELEMENT = '[dv-chart-container]';
const DV_CHART_TABLE_CONTAINER_ELEMENT = '[dv-chart-table-container]';

@Component({
    components: {
        'dv-chart-slider': ChartSlider
    }
})
export default class Chart extends Vue {
    readonly logMarker: string = `[chart='${this.id}']`;

    dvchart: DVChart;
    isLoading: boolean = true;

    sliderExists: boolean = false;

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

    // a subject used to stop all other observable subscriptions
    deactivate: Subject<boolean> = new Subject<boolean>();

    // a flag indicating the section is manually dismounted only, but the parent section has not been destroyed yet
    dismountOnly: boolean = false;

    created(): void {
        // section is created programmatically and template is missing `id` on a `<dv-chart>` node making it impossible to link in the chart's config
        if (!this.id) {
            log.error(`[chart='?'] missing 'id' attribute in [section='${this.rootSectionId}']`);
            return;
        }

        // section is created programmatically and one or more charts were not added to the DVSection object
        if (!charts[this.id]) {
            log.error(`${this.logMarker} is not defined in [section='${this.rootSectionId}']`);
            return;
        }

        // store reference to the DVChart instance related to this chart component
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
            log.error(`${this.logMarker} export-data module required for chart data table`);
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

            if (this.$el.parentNode) {
                this.$el.parentNode!.removeChild(this.$el);
            }
            return;
        }

        // find chart and table containers
        this._chartContainer = this.$el.querySelector(DV_CHART_CONTAINER_ELEMENT) as HTMLElement;

        // subscribe to stream of config update events and wait for this chart's id
        chartConfigUpdated
            .filter((event: ChartConfigUpdatedEvent) => event.chartId === this.id)
            .takeUntil(this.deactivate)
            .subscribe(() => (this.dvchart.config ? this.renderChart() : this.invalidateChart()));

        // track dismount event and mark this components as dismounted when a corresponding event is fired
        sectionDismounted
            .filter((event: SectionDismountEvent) => event.sectionId === this.rootSectionId)
            .takeUntil(this.deactivate)
            .subscribe(event => (this.dismountOnly = event.dismountOnly));

        if (this.dvchart.isConfigValid) {
            this.renderChart();
        }
    }

    beforeDestroy(event: any): void {
        // deactivate all running subscriptions and unsubscribe from the deactivator subscription
        this.deactivate.next(true);
        this.deactivate.unsubscribe();

        if (!this.dismountOnly) {
            // push destroy even into the pipe
            chartDestroyed.next({ chartId: this.id, dvchart: this.dvchart });

            log.info(`${this.logMarker} chart component dismounted and destroyed`);
        } else {
            log.info(`${this.logMarker} chart component dismounted only`);
        }
    }

    // buid key is used to force remount adjunct component of the DVChart like zoom slider
    // every time the chart is rendered, the slider is destroyed and rebuilt
    buildKey: number = 0;

    /**
     * Reverts the  chart to the initial condition of waiting for the config to resolve if the config value has been set to `null/undefined`.
     * The chart will remain in the DOM.
     * The host page can use `dv-loading` class set on the `dv-chart` node to style the loading chart instance.
     */
    invalidateChart(): void {
        log.info(`${this.logMarker} invalidating chart until a valid config is provided`);

        this.isLoading = true;
    }

    renderChart(): void {
        log.info(`${this.logMarker} rendering chart`);

        // create a deep copy of the original config for reference
        const originalConfig: DVHighcharts.Options = deepmerge({}, this.dvchart.config);

        const originalViewDataOption: DVHighcharts.MenuItem | undefined = originalConfig.exporting
            .menuItemDefinitions.viewData!;

        // create an update snippet for the config based on the DQV options (table generation is the only one for now)
        const configUpdates: DVHighcharts.Options = {
            exporting: {
                menuItemDefinitions: {
                    viewData:
                        // if no exporting options exist (`undefined` only, `null` has meaning in chart config - it hides that option), an internal one will be supplied
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
                    setExtremes: (event: Highcharts.AxisEvent) =>
                        this._setExtremesHandler(
                            event,
                            // defaults containing an empty `setExtremes` handler are applied to the chart config using deepmerge
                            // however, if `xAxi` for examples is explicity set to `undefined` in the config, the defaults will not apply
                            // which will cause this assertion to fail
                            // TODO: either apply defaults in a more robust way or find anothe way handling the null/undefined checks
                            (<Highcharts.AxisOptions>originalConfig.xAxis!).events!.setExtremes!
                        )
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

        log.info(`${this.logMarker} chart rendered`);

        this.validateSlider('xAxis');
        this.buildKey++;

        if (this.autoGenerateTable) {
            this.simulateViewDataClick();
        }
    }

    validateSlider(axis: string) {
        // returns a highcharts from the current dvchart object
        // this should only be called after the chart is rendered
        let highchart: any = this.dvchart!.highchart!;

        // axis linked to the slider
        let axisObject = highchart[axis][0] as DVHighcharts.AxisObject;

        // extremes of the axis linked to the slider
        let extremes = axisObject.getExtremes();

        // TODO: vet using a list of chart types that can have extremes sliders
        if (typeof extremes.dataMin === 'undefined') {
            log.info(`${this.logMarker} ${axis} zoom slider cannot be used with this chart`);
            this.sliderExists = false;
            return;
        }

        // chart's config is not set
        if (!this.dvchart!.config) {
            log.info(`${this.logMarker} ${axis} config isn't set - zoom slider can't be used`);
            this.sliderExists = false;
            return;
        }

        // get `chart` section from the config chart
        const chartChartConfig: DVHighcharts.ChartOptions | undefined = this.dvchart!.config!.chart;

        // get zoomType from the chart config
        // if zoomType doesn't match this slider axis, self-destruct
        const zoomType = chartChartConfig ? chartChartConfig.zoomType || '' : '';
        if (zoomType.indexOf(axis.charAt(0)) === -1) {
            log.info(`${this.logMarker} ${axis} zoom is not enabled for this chart`);
            this.sliderExists = false;
            return;
        }

        // get the user-defined zoom slider config
        // if null, the slider will not be rendered
        // if undefined, the default slider config is used
        const userSliderConfig: noUiSlider.Options | null | undefined | {} = chartChartConfig
            ? (<any>chartChartConfig).zoomSlider
            : {};

        // kill the slider node if the slider option is explicitly set to null
        if (userSliderConfig === null) {
            log.info(`${this.logMarker} ${axis} zoom slider is disabled in the chart config`);
            this.sliderExists = false;
            return;
        }

        this.sliderExists = true;
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
