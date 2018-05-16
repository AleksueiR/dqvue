<template>
    <div dv-chart-slider-container>
        <label class="dv-slider-input-label" :for="'min-slider-input-' + dvchart.id">{{labels[0]}}</label>
        <input :id="'min-slider-input-' + dvchart.id" type="text" v-model.number="minValue" pattern="[0-9]"
            @change="updateRange"
            class="dv-slider-input dv-slider-min">

        <div class="noUi-target"></div>

        <input :id="'max-slider-input-' + dvchart.id" type="text" v-model.number="maxValue" pattern="[0-9]"
            @change="updateRange"
            class="dv-slider-input dv-slider-max">
        <label class="dv-slider-input-label" :for="'max-slider-input-' + dvchart.id">{{labels[1]}}</label>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';
import { DVHighcharts, DQVSliderOptions } from './../api/main';

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
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/sampleTime';
import 'rxjs/add/operator/takeUntil';

import { DVChart } from './../classes/chart';

import { keyCodes } from './../utils';

const CHART_SLIDER_CLASS = '.noUi-target';

const LABEL_DEFAULTS = ['Minimum', 'Maximum'];

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

    dvchart: DVChart;

    // returns a highcharts from the current dvchart object
    // this should only be called after the chart is rendered
    get highchart(): DVHighcharts.ChartObject {
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

    labels: string[] = LABEL_DEFAULTS;

    // a subject used to stop all other observable subscriptions
    deactivate: Subject<boolean> = new Subject<boolean>();

    /**
     * Cache reference to the corresponding chart object.
     * built-in handler when the compoment is first created (not in the DOM yet and its children might not exist yet)
     */
    created(): void {
        this.dvchart = charts[this.chartId] as DVChart;
    }

    /**
     * Set up listeners on `rendered` and `setExtremes` event streams.
     * buil-it handler when the component is inserted into the DOM
     */
    mounted(): void {
        log.info(`${this.logMarker} zoom slider mounted`);

        // it's guaranteed that the chart has been rendered at this point
        // initialize the noUI slider when the parent chart renders
        this.initializeSlider();
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

    // check if the slider can be created for this chart and if all the slider config options are set correctly
    initializeSlider(): void {
        log.info(`${this.logMarker} attempting to initialize zoom slider`);

        // if the slider is alreayd initialize, destroy it and create a new one
        // this is needed in case the slider config portion of the chart config was changed or is not compatible with the old slider configuration
        if (this.sliderNode) {
            log.info(`${this.logMarker} slider already initialized; re-creating`);

            this.sliderNode.noUiSlider.destroy();
            this.sliderNode.classList.add('noUi-target');
        }

        // cached the slider node after all checks succeed
        this.sliderNode = this.$el.querySelector(CHART_SLIDER_CLASS) as noUiSlider.Instance;

        // get `chart` section from the config chart
        const chartChartConfig: DVHighcharts.ChartOptions = this.dvchart!.config!.chart!;
        // get the user-defined zoom slider config
        // if null, the slider will not be rendered
        // if undefined, the default slider config is used
        const userSliderConfig: DQVSliderOptions = chartChartConfig
            ? (<any>chartChartConfig).zoomSlider
            : {};

        if (userSliderConfig && userSliderConfig.labels) {
            this.labels = userSliderConfig.labels;
        }

        noUiSlider.create(
            this.sliderNode,
            deepmerge(this.defaultSliderConfig, userSliderConfig || {}, {
                // overwrite arrays rather than merging
                arrayMerge: (destination, source) => source
            })
        );

        this.enableKeyboardSupport();

        log.info(`${this.logMarker} ${this.axis} slider has initialized`);

        // listen to extremes changed by the user
        // TODO: filter by the axis as well as the chart id
        // `&& event.axis === this.axis`
        chartSetExtremes
            .filter(this._filterStream, this)
            .takeUntil(this.deactivate)
            .subscribe(this.setExtremesHandler);

        // listen to 'update' events on the slider update
        Observable.fromEvent(
            this.sliderNode.noUiSlider,
            'update',
            (values: string[], handle: number) => ({ values, handle })
        )
            .takeUntil(this.deactivate)
            .subscribe(this.sliderUpdateHandler);
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
        const keydownEvents: Observable<KeyboardEvent> = Observable.fromEvent(handles, 'keydown')
            .filter((event: KeyboardEvent) => {
                return eventList.indexOf(event.keyCode) !== -1;
            })
            .takeUntil(this.deactivate) as Observable<KeyboardEvent>;

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

        /**
         * chart fires a setExtremes with total number of year fewer than 20 (say 1904, 1908)
         * chart starts zoom in animation (minRange options refers to the minimum range displayed on the chart, but instead of starting with the min value and adding the min range after it, Highcharts pad the selected range on both sides up-to the minimumRange value)
         * dqv tries to set the slider to the supplied extremes
         * slider updates but respects the 20 year limit and fires its update event with new extremes (say 1904, 1924)
         * dqv now tries to set the chart to new extremes (say 1904, 1924)
         * chart just started animating the initial setExtremes, and ignores the second call
         *
         * This timeout makes the chart take the second (this) setExtremes call, and the slider stays properly synced with the chart
         */
        window.setTimeout(() => {
            this.axisObject.setExtremes(this.minValue, this.maxValue, true, false);
        }, 0);
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

    // buil-it handler firing before the component is removed from the DOM
    beforeDestroy(): void {
        // deactivate all running subscriptions and unsubscribe from the deactivator subscription
        this.deactivate.next(true);
        this.deactivate.unsubscribe();

        log.info(`${this.logMarker} zoom slider component destroyed`);
    }

    /**
     * Destroys the chart slider component, all its elements, and removes itself from the DOM.
     * The suggested way is to control the lifecycle of child components in a data-driven fashion using v-if and v-for.
     * This would require moving much logic of determining if the slider should be visible to chart component.
     */
    destroyItself(): void {
        // hm, I think if the config is refreshed, the slider will be re-cretead anyway
        log.info(`${this.logMarker} attempting to destroy zoom slider`);

        this.$destroy();

        while (this.$el.firstChild) {
            this.$el.removeChild(this.$el.firstChild);
        }

        // the component might not be yet inserted into the dom, so its parent node might not be defined
        if (this.$el.parentNode) {
            this.$el.parentNode!.removeChild(this.$el);
        }
    }

    /**
     * Filters out stream events for that belong to other parent charts.
     *
     * @param {ChartEvent} event ChartEvent fired by the Chart component
     * @returns {boolean} `true` if the event should be processed
     */
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
    display: flex;
    align-items: center;
    margin: 10px 0;

    .dv-slider-input {
        text-align: center;
        padding-top: 2px;
        padding-bottom: 2px;
    }

    .dv-slider-input-label {
        margin: 0 4px;
    }

    // add a bit of padding around the slider container to accomodate for the entry field on the sides
    .noUi-target {
        flex: 1; // fill the available width of the slider container
        margin: 0 20px;
    }

    // these two blocks are taken from the noUiSlider styles and modified to select on the `html:not([dir='rtl'])` element outside the DQV scope
    // otherwise, the slider appearance will only work in `rtl` pages
    /* Offset direction
    */
    .noUi-horizontal .noUi-origin {
        html:not([dir='rtl']) & {
            left: auto;
            right: 0;
        }
    }

    .noUi-horizontal .noUi-handle {
        html:not([dir='rtl']) & {
            right: -17px;
            left: auto;
        }
    }

    // import noUiSlider styles
    // notice that the file is being imported not as `.css`; if imported as `.css`, it will not be scoped (raw injection)
    @import './../../node_modules/nouislider/distribute/nouislider';
}
</style>
