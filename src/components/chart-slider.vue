<template>
    <div dv-chart-slider-container>
        <input type="text" v-model.number="minValue" pattern="[0-9]"
            @change="updateRange"
            class="dv-slider-input dv-slider-min">

        <div class="noUi-target"></div>

        <input type="text" v-model.number="maxValue" pattern="[0-9]"
            @change="updateRange"
            class="dv-slider-input dv-slider-max">
    </div>    
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';
import { DVHighcharts } from './../api/main';

import noUiSlider from 'nouislider';
import wNumb from 'wnumb';
import deepmerge from 'deepmerge';

import {
    chartRendered,
    chartSetExtremes,
    ChartEvent,
    ChartRenderedEvent,
    ChartSetExtremesEvent
} from './../observable-bus';

import { charts } from './../store/main';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/sampleTime';

import { DVChart } from './../classes/chart';

import { keyCodes } from './../utils';

const CHART_SLIDER_CLASS = '.noUi-target';

const log: loglevel.Logger = loglevel.getLogger('dv-chart-slider');

@Component
export default class ChartSlider extends Vue {
    readonly logMarker: string = `[chart-slider chart='${this.chartId}']`;

    @Inject() rootChartId: string;

    @Prop() axis: ChartSetExtremesEvent['axis'];

    // TODO: since the slider is always inside the chart node, pass chart id as a prop
    get chartId(): string {
        return this.rootChartId;
    }

    dvchart: DVChart | null = null;

    // returns a highcharts from the current dvchart object
    // this should only be called after the chart is rendered
    get highchart(): DVHighcharts.ChartObject {
        if (!this.dvchart) {
            throw new TypeError(`${this.logMarker} dvchart ${this.chartId} is not defined`);
        }

        if (!this.dvchart.highchart) {
            throw new TypeError(
                `${this.logMarker} Highchart is not defined on ${this.chartId} dvchart`
            );
        }

        return this.dvchart.highchart;
    }

    // axis linked to the slider
    get axisObject(): DVHighcharts.AxisObject {
        // TODO: decide what to do and handle cases with multiple X/Y axes
        // return this.highchart![this.axis][0] as DVHighcharts.AxisObject;
        return this.highchart[this.axis][0] as DVHighcharts.AxisObject;
    }

    // extremes of the axis linked to the slider
    get extremes(): Highcharts.Extremes {
        const extremes: Highcharts.Extremes = this.axisObject.getExtremes();

        return extremes;
    }

    // a reference to the main slider node
    sliderNode: noUiSlider.Instance;

    minValue: number = 0;
    maxValue: number = 0;

    /**
     * Cache reference to the corresponding chart object.
     */
    created(): void {
        this.dvchart = charts[this.chartId] as DVChart;
    }

    /**
     * Set up listeners on `rendered` and `setExtremes` event streams.
     */
    mounted(): void {
        if (!this.dvchart) {
            log.info(`[chart-slider chart='${this.chartId}'] referenced chart does not exist`);
            this.selfDestruct();
            return;
        }

        // initialize the noUI slider when the parent chart renders
        chartRendered.filter(this._filterStream, this).subscribe(this.initializeSlider);

        // listen to extremes changed by the user
        // TODO: move subscription into the init function - subscribe only if there is a slider ready
        chartSetExtremes.filter(this._filterStream, this).subscribe(this.setExtremesHandler);
    }

    // default slider config will be used if no slider options are specified in the user config
    get defaultSliderConfig(): noUiSlider.Options {
        return {
            start: [this.extremes.dataMin, this.extremes.dataMax],
            connect: true,
            // tooltips: [wNumb({ decimals: 2 }), wNumb({ decimals: 2 })],
            behaviour: 'tap-drag',
            animate: false,
            // step: 1,
            // margin: 20,
            margin: this.axisObject.minRange, // respect min range of the axis
            /* format: wNumb({
                decimals: 0
            }), */
            range: {
                min: this.extremes.dataMin,
                max: this.extremes.dataMax
            }
        };
    }

    initializeSlider(event: ChartRenderedEvent): void {
        // if the slider is alreayd initialize, destroy it and create a new one
        // this is needed in case the slider config portion of the chart config was changed or is not compatible with the old slider configuration
        if (this.sliderNode) {
            log.info(`${this.logMarker} slider already initialized; re-creating`);

            this.sliderNode.noUiSlider.destroy();
            this.sliderNode.classList.add('noUi-target');
        }

        // TODO: vet using a list of chart types that can have extremes sliders
        if (typeof this.extremes.dataMin === 'undefined') {
            log.info(`${this.logMarker} ${this.axis} zoom slider cannot be used with this chart`);
            this.selfDestruct();
            return;
        }

        // get `chart` section from the config chart
        const chartChartConfig: DVHighcharts.ChartOptions | undefined = this.dvchart!.config!.chart;

        // get zoomType from the chart config
        // if zoomType doesn't match this slider axis, self-destruct
        const zoomType = chartChartConfig ? chartChartConfig.zoomType || '' : '';
        if (zoomType.indexOf(this.axis.charAt(0)) === -1) {
            log.info(`${this.logMarker} ${this.axis} zoom is not enabled for this chart`);
            this.selfDestruct();
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
            log.info(`${this.logMarker} ${this.axis} zoom slider is disabled in the chart config`);
            this.selfDestruct();
            return;
        }

        // cached the slider node after all checks succeed
        this.sliderNode = this.$el.querySelector(CHART_SLIDER_CLASS) as noUiSlider.Instance;

        noUiSlider.create(
            this.sliderNode,
            deepmerge(this.defaultSliderConfig, userSliderConfig || {})
        );

        this.enableKeyboardSupport();

        log.info(`${this.logMarker} ${this.axis} slider has initialized`);

        // listen to 'update' events on the slider ober
        Observable.fromEvent(
            this.sliderNode.noUiSlider,
            'update',
            (values: string[], handle: number) => ({ values, handle })
        ).subscribe(this.sliderUpdateHandler);
    }

    // add keyboard support to the slider
    // - right/up keys move the handle to the right by a single step
    // - left/down keys move the handle to the left by a single step
    // - home key moves the handle all the way to the left
    // - end key moves the handles all the way to the right
    // - +shift holding key moves the handle by ten steps at a time
    // - +ctrl holding key moves both handles at the same time
    // ctrl and shift modifier keys work together all with all movement keys
    enableKeyboardSupport(): void {
        const step: number = this.sliderNode.noUiSlider.options.step || 0.01;
        const configMargin: number = this.sliderNode.noUiSlider.options.margin!;
        const handles: NodeListOf<Element> = this.sliderNode.querySelectorAll('.noUi-handle');

        const eventList: number[] = [
            keyCodes.RIGHT_ARROW,
            keyCodes.DOWN_ARROW,
            keyCodes.LEFT_ARROW,
            keyCodes.UP_ARROW,
            keyCodes.HOME,
            keyCodes.END
        ];

        // create observable from event stream and filter out events which are not used
        const keydownEvents: Observable<KeyboardEvent> = Observable.fromEvent(
            handles,
            'keydown'
        ).filter((event: KeyboardEvent) => {
            return eventList.indexOf(event.keyCode) !== -1;
        }) as Observable<KeyboardEvent>;

        // stop defaults and propagations all selected keyboard events
        keydownEvents.subscribe((event: KeyboardEvent) => {
            event.preventDefault();
            event.stopPropagation();
        });

        // to avoid firing to many slider/chart updates to quickly, process only one event every 30 ms
        keydownEvents.sampleTime(30).subscribe((event: KeyboardEvent) => {
            // holding shift key modifies the size of the step
            const modifier: number = event.shiftKey ? 10 : 1;

            // assume we always have only two handles on the slider
            // get returns strings, not numbers as per definitions
            const values: number[] = (this.sliderNode.noUiSlider.get() as any[]).map(value =>
                parseFloat(value)
            );
            const currentMargin: number = values[1] - values[0];
            const handleId: number = parseInt((<HTMLElement>event.target).getAttribute(
                'data-handle'
            ) as string);

            // holding ctrl key moves both handles at the same time, shifting the selected range
            if (event.keyCode === keyCodes.UP_ARROW || event.keyCode === keyCodes.RIGHT_ARROW) {
                // up/right arrow moves the handles to the right
                values[handleId] += step * modifier;

                if (event.ctrlKey) {
                    values[1 - handleId] += step * modifier;
                }
            } else if (
                event.keyCode === keyCodes.DOWN_ARROW ||
                event.keyCode === keyCodes.LEFT_ARROW
            ) {
                // down/left arrow moves the handles to the right
                values[handleId] -= step * modifier;

                if (event.ctrlKey) {
                    values[1 - handleId] -= step * modifier;
                }
            }

            if (event.keyCode === keyCodes.END) {
                // end key moves the handle all the way to the right
                values[handleId] = this.extremes.dataMax;

                if (event.ctrlKey) {
                    [values[0], values[1]] = [
                        this.extremes.dataMax - currentMargin,
                        this.extremes.dataMax
                    ];
                }
            } else if (event.keyCode === keyCodes.HOME) {
                // home key moves the handle all the way to the left
                values[handleId] = this.extremes.dataMin;

                if (event.ctrlKey) {
                    [values[0], values[1]] = [
                        this.extremes.dataMin,
                        this.extremes.dataMin + currentMargin
                    ];
                }
            }

            // handle values cannot exceed extremes
            [values[0], values[1]] = [
                Math.max(this.extremes.dataMin, values[0]),
                Math.min(this.extremes.dataMax, values[1])
            ];

            // two handles cannot be closer than the `configMargin`
            // if the ctrl key is pressed, closer than the `currentMargin`
            const margin: number = event.ctrlKey ? currentMargin : configMargin;
            if (values[1] - values[0] < margin) {
                values[handleId] = handleId === 0 ? values[1] - margin : values[0] + margin;
            }

            [this.minValue, this.maxValue] = values;

            this.updateRange();
        });
    }

    // handles the SetExtremesEvent streamed by the parent Chart object
    setExtremesHandler(event: ChartSetExtremesEvent): void {
        const newMinValue = event.min || this.extremes.dataMin;
        const newMaxValue = event.max || this.extremes.dataMax;

        // SetExtremesEvent range is the same as the currently selected range; do nothing;
        if (this.isCurrentRange(newMinValue, newMaxValue)) {
            return;
        }

        this.minValue = newMinValue;
        this.maxValue = newMaxValue;

        this.updateSlider();
    }

    // handles 'update' events on the slider object
    sliderUpdateHandler({ values, handle }: { values: string[]; handle: number }): void {
        // slider updated range is the same as the currently selected range; do nothing;
        if (this.isCurrentRange(values[0], values[1])) {
            return;
        }

        this.minValue = parseFloat(values[0]);
        this.maxValue = parseFloat(values[1]);

        this.updateExtremes();
    }

    // udpate the parent chart's extremes on the corresponding axis
    updateExtremes(): void {
        const resetZoomButton: Highcharts.ElementObject | undefined = this.highchart
            .resetZoomButton;

        if (this.isFullRange()) {
            // destroy and disable the reset zoom button if the currently selected range is the same as the maximum range
            if (resetZoomButton && resetZoomButton.destroy) {
                resetZoomButton.destroy();
                this.highchart.resetZoomButton = undefined;
            }
        } else {
            // show zoom reset button, if not already visible
            if (!resetZoomButton) {
                this.highchart.showResetZoom();
            }
        }

        this.axisObject.setExtremes(this.minValue, this.maxValue, true, false);
    }

    // update slider value with the currently selected range
    updateSlider(): void {
        this.sliderNode.noUiSlider.set([this.minValue, this.maxValue]);
    }

    // update both slider and chart's extremes
    updateRange(): void {
        this.updateExtremes();
        this.updateSlider();
    }

    // checks if the currently selected range is the same as the provided range
    isCurrentRange(min: number | string, max: number | string): boolean {
        return (
            this.minValue === parseFloat(min.toString()) &&
            this.maxValue === parseFloat(max.toString())
        );
    }

    // checks if the currently selected range is the same as the maximum range
    isFullRange(): boolean {
        return this.minValue === this.extremes.dataMin && this.maxValue === this.extremes.dataMax;
    }

    selfDestruct(): void {
        // TODO: instead of removing the slider controls, hide them; it's possible to refresh the chart with a proper slider config
        // in this can, the slider can be initialized normally
        this.$destroy();

        while (this.$el.firstChild) {
            this.$el.removeChild(this.$el.firstChild);
        }

        this.$el.parentNode!.removeChild(this.$el);
    }

    private _filterStream(event: ChartEvent): boolean {
        return event.chartId === this.chartId;
    }
}
</script>

<style lang="scss" scoped>
.dv-slider-input {
    width: 50px;
}

div[dv-chart-slider-container] /deep/ {
    // margin: 10px 20px;

    display: flex;
    align-items: center;
    margin: 10px 0;

    .dv-slider-input {
        text-align: center;
        padding-top: 2px;
        padding-bottom: 2px;
    }

    .noUi-target {
        flex: 1;
        margin: 0 20px;
    }

    /*! nouislider - 10.1.0 - 2017-07-28 17:11:18 */
    /* Functional styling;
 * These styles are required for noUiSlider to function.
 * You don't need to change these rules to apply your design.
 */
    .noUi-target,
    .noUi-target * {
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        -webkit-user-select: none;
        -ms-touch-action: none;
        touch-action: none;
        -ms-user-select: none;
        -moz-user-select: none;
        user-select: none;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }
    .noUi-target {
        position: relative;
        direction: ltr;
    }
    .noUi-base {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        /* Fix 401 */
    }
    .noUi-connect {
        position: absolute;
        right: 0;
        top: 0;
        left: 0;
        bottom: 0;
    }
    .noUi-origin {
        position: absolute;
        height: 0;
        width: 0;
    }
    .noUi-handle {
        position: relative;
        z-index: 1;
    }
    .noUi-state-tap .noUi-connect,
    .noUi-state-tap .noUi-origin {
        -webkit-transition: top 0.3s, right 0.3s, bottom 0.3s, left 0.3s;
        transition: top 0.3s, right 0.3s, bottom 0.3s, left 0.3s;
    }
    .noUi-state-drag * {
        cursor: inherit !important;
    }
    /* Painting and performance;
 * Browsers can paint handles in their own layer.
 */
    .noUi-base,
    .noUi-handle {
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
    }
    /* Slider size and handle placement;
 */
    .noUi-horizontal {
        height: 18px;
    }
    .noUi-horizontal .noUi-handle {
        width: 34px;
        height: 28px;
        left: -17px;
        top: -6px;
    }
    .noUi-vertical {
        width: 18px;
    }
    .noUi-vertical .noUi-handle {
        width: 28px;
        height: 34px;
        left: -6px;
        top: -17px;
    }
    /* Styling;
 */
    .noUi-target {
        background: #fafafa;
        border-radius: 4px;
        border: 1px solid #d3d3d3;
        box-shadow: inset 0 1px 1px #f0f0f0, 0 3px 6px -5px #bbb;
    }
    .noUi-connect {
        background: #3fb8af;
        border-radius: 4px;
        box-shadow: inset 0 0 3px rgba(51, 51, 51, 0.45);
        -webkit-transition: background 450ms;
        transition: background 450ms;
    }
    /* Handles and cursors;
 */
    .noUi-draggable {
        cursor: ew-resize;
    }
    .noUi-vertical .noUi-draggable {
        cursor: ns-resize;
    }
    .noUi-handle {
        border: 1px solid #d9d9d9;
        border-radius: 3px;
        background: #fff;
        cursor: default;
        box-shadow: inset 0 0 1px #fff, inset 0 1px 7px #ebebeb, 0 3px 6px -3px #bbb;
    }
    .noUi-active {
        box-shadow: inset 0 0 1px #fff, inset 0 1px 7px #ddd, 0 3px 6px -3px #bbb;
    }
    /* Handle stripes;
 */
    .noUi-handle:before,
    .noUi-handle:after {
        content: '';
        display: block;
        position: absolute;
        height: 14px;
        width: 1px;
        background: #e8e7e6;
        left: 14px;
        top: 6px;
    }
    .noUi-handle:after {
        left: 17px;
    }
    .noUi-vertical .noUi-handle:before,
    .noUi-vertical .noUi-handle:after {
        width: 14px;
        height: 1px;
        left: 6px;
        top: 14px;
    }
    .noUi-vertical .noUi-handle:after {
        top: 17px;
    }
    /* Disabled state;
 */
    [disabled] .noUi-connect {
        background: #b8b8b8;
    }
    [disabled].noUi-target,
    [disabled].noUi-handle,
    [disabled] .noUi-handle {
        cursor: not-allowed;
    }
    /* Base;
 *
 */
    .noUi-pips,
    .noUi-pips * {
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }
    .noUi-pips {
        position: absolute;
        color: #999;
    }
    /* Values;
 *
 */
    .noUi-value {
        position: absolute;
        white-space: nowrap;
        text-align: center;
    }
    .noUi-value-sub {
        color: #ccc;
        font-size: 10px;
    }
    /* Markings;
 *
 */
    .noUi-marker {
        position: absolute;
        background: #ccc;
    }
    .noUi-marker-sub {
        background: #aaa;
    }
    .noUi-marker-large {
        background: #aaa;
    }
    /* Horizontal layout;
 *
 */
    .noUi-pips-horizontal {
        padding: 10px 0;
        height: 80px;
        top: 100%;
        left: 0;
        width: 100%;
    }
    .noUi-value-horizontal {
        -webkit-transform: translate3d(-50%, 50%, 0);
        transform: translate3d(-50%, 50%, 0);
    }
    .noUi-marker-horizontal.noUi-marker {
        margin-left: -1px;
        width: 2px;
        height: 5px;
    }
    .noUi-marker-horizontal.noUi-marker-sub {
        height: 10px;
    }
    .noUi-marker-horizontal.noUi-marker-large {
        height: 15px;
    }
    /* Vertical layout;
 *
 */
    .noUi-pips-vertical {
        padding: 0 10px;
        height: 100%;
        top: 0;
        left: 100%;
    }
    .noUi-value-vertical {
        -webkit-transform: translate3d(0, 50%, 0);
        transform: translate3d(0, 50%, 0);
        padding-left: 25px;
    }
    .noUi-marker-vertical.noUi-marker {
        width: 5px;
        height: 2px;
        margin-top: -1px;
    }
    .noUi-marker-vertical.noUi-marker-sub {
        width: 10px;
    }
    .noUi-marker-vertical.noUi-marker-large {
        width: 15px;
    }
    .noUi-tooltip {
        display: block;
        position: absolute;
        border: 1px solid #d9d9d9;
        border-radius: 3px;
        background: #fff;
        color: #000;
        padding: 5px;
        text-align: center;
        white-space: nowrap;
    }
    .noUi-horizontal .noUi-tooltip {
        -webkit-transform: translate(-50%, 0);
        transform: translate(-50%, 0);
        left: 50%;
        bottom: 120%;
    }
    .noUi-vertical .noUi-tooltip {
        -webkit-transform: translate(0, -50%);
        transform: translate(0, -50%);
        top: 50%;
        right: 120%;
    }
}
</style>
