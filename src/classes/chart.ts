import uniqid from 'uniqid';
import loglevel from 'loglevel';
import deepmerge from 'deepmerge';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

import { DVHighcharts } from './../api/main';

import {
    chartCreated,
    chartRendered,
    chartViewData,
    chartConfigUpdated,
    ChartEvent,
    ChartRenderedEvent,
    ChartViewDataEvent
} from './../observable-bus';

import { isPromise } from './../utils';
import { DVSection } from './section';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

export type SeriesData =
    | (number | [number, number] | [string, number] | Highcharts.DataPoint)[]
    | undefined;

export interface DVChartOptions {
    id?: string;
    config?: DVHighcharts.Options | Promise<DVHighcharts.Options>;
    data?: SeriesData | Promise<SeriesData>;
}

export class DVChart {
    private static configDefaults: DVHighcharts.Options = {
        // default events so that long existance checks don't need to be made
        xAxis: {
            events: {
                setExtremes: () => {}
            }
        },
        exporting: {
            menuItemDefinitions: {}
        }
    };

    readonly id: string;

    private _isConfigValid: boolean = false;

    private _config: DVHighcharts.Options | null = null;
    private _configPromise: Promise<DVHighcharts.Options> | null = null;
    private _data: SeriesData | null = null;
    private _dataPromise: Promise<SeriesData> | null = null;

    private _isTableGenerated: boolean = false;

    private _highchartObject: DVHighcharts.ChartObject | null = null;

    constructor({ id = uniqid.time(), config = null, data = null }: DVChartOptions = {}) {
        this.id = id;

        log.info(`[chart='${this.id}'] new chart is created`);

        if (isPromise<DVHighcharts.Options>(config)) {
            this.setConfig(config);
        } else if (config !== null) {
            this.config = config;
        }

        if (isPromise<SeriesData>(data)) {
            this.setData(data);
        } else if (data !== null) {
            this.data = data;
        }

        // TODO: merge observable from the chart view to the rendered observable here
        // every time the chart is re-rendered, store the reference to the highchart object
        chartRendered
            .filter(this._filterStream, this)
            .subscribe(
                (event: ChartRenderedEvent) => (this._highchartObject = event.highchartObject)
            );

        chartViewData
            .filter(this._filterStream, this)
            .subscribe(() => (this._isTableGenerated = true));

        chartCreated.next({ chartId: this.id, dvchart: this });
    }

    get isTableGenerated(): boolean {
        return this._isTableGenerated;
    }

    get highchart(): DVHighcharts.ChartObject | null {
        if (!this._highchartObject) {
            log.warn(`[chart='${this.id}'] chart has not been rendered yet`);
        }

        return this._highchartObject;
    }

    set config(value: DVHighcharts.Options | null) {
        this._config = this._addConfigDefaults(value);
        this._configPromise = null;

        log.info(`[chart='${this.id}'] config value is set successfully`);

        this._isConfigValid = false;
        this._validateConfig();
    }

    setConfig(value: Promise<DVHighcharts.Options>): DVChart {
        log.info(`[chart='${this.id}'] waiting for config promise to resolve`);

        // set config to 'null', to remove the chart until the config is resolved
        this.config = null;

        this._configPromise = value;

        value.then(config => {
            if (value === this._configPromise) {
                this.config = config;
            }
        });

        return this;
    }

    get config(): DVHighcharts.Options | null {
        return this._config;
    }

    /**
     * apply some default/empty values to the config which are used by internal compoenents
     * this makes it easier to access them without have to check if they exist all the time
     *
     * @private
     * @memberof DVChart
     */
    private _addConfigDefaults(config: DVHighcharts.Options | null): DVHighcharts.Options | null {
        if (!config) {
            return null;
        }

        return deepmerge(DVChart.configDefaults, config);
    }

    set data(value: SeriesData | null) {
        this._data = value;
        this._dataPromise = null;

        log.info(`[chart='${this.id}'] data value is set successfully`);

        this._isConfigValid = false;
        this._validateConfig();
    }

    setData(value: Promise<SeriesData>): DVChart {
        log.info(`[chart='${this.id}'] waiting for data promise to resolve`);

        this._dataPromise = value;
        value.then(data => {
            if (value === this._dataPromise) {
                this.data = data;
            }
        });

        return this;
    }

    get data(): SeriesData | null {
        return this._data;
    }

    refresh(): void {
        this._validateConfig();
    }

    private _validateConfig(): void {
        log.info(`[chart='${this.id}'] attempting to validate config`);

        if (!this.config) {
            // TODO: complain that chart config is missing

            log.warn(`[chart='${this.id}'] chart config is not set (or set to a \`null\` value)`);

            // since the config has been explicitly set to `null/undefined`, fire the configUpdated event
            // this will revert the chart state to waiting for a proper config to resolve
            chartConfigUpdated.next({ chartId: this.id, dvchart: this });

            return;
        }

        if (!this.config.series) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            log.warn(`[chart='${this.id}'] invalid config - charts series are missing`);

            return;
        }

        // if chart data is provided in a separate object, merge it into the config
        if (this.data) {
            if (this.data.length !== this.config.series.length) {
                // TODO: complain that series data supplied does not match chart config provided

                log.warn(
                    `[chart='${
                        this.id
                    }'] invalid config - provided data does not match chart series`
                );

                return;
            } else {
                // TODO: can we assume here that series data provided is of correct type
                // mash data object into the chart series
                this.data.forEach(
                    (seriesData, index) =>
                        (this.config!.series![index].data = seriesData as SeriesData)
                );
            }
        }

        // check if all chart series have corresponding data object
        const isSeriesValid = this.config.series.some(
            (series: Highcharts.IndividualSeriesOptions) => typeof series.data !== 'undefined'
        );

        if (!isSeriesValid) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            log.warn(`[chart='${this.id}'] invalid config - chart data is incomplete`);

            return;
        }

        log.info(`[chart='${this.id}'] chart config is valid`);

        this._isConfigValid = true;
        chartConfigUpdated.next({ chartId: this.id, dvchart: this });
    }

    get isConfigValid(): boolean {
        return this._isConfigValid;
    }

    /* duplicate(): DVChart {
        log.info(`[chart='${this.id}'] attempting to duplicate`);

        // TODO: implement

        log.info(`[chart='${this.id}'] duplicated successfully`);

        return this;
    } */

    private _filterStream(event: ChartEvent): boolean {
        return event.chartId === this.id;
    }

    updateTable(): void {
        chartViewData.next({ chartId: this.id, dvchart: this });
    }
}
