import uniqid from 'uniqid';
import * as loglevel from 'loglevel';
import * as Highcharts from 'highcharts';

import { EventBus, CHART_CREATED, CHART_CONFIG_UPDATED } from './../event-bus';

import { isPromise } from './../utils';

const log: loglevel.Logger = loglevel.getLogger('dv-chart');

export type SeriesData = (number | [number, number] | [string, number] | Highcharts.DataPoint)[] | undefined;

export interface DVChartOptions {
    id?: string,
    config?: Highcharts.Options | Promise<Highcharts.Options>,
    data?: SeriesData | Promise<SeriesData>
};

export class DVChart {
    readonly id: string;

    private _isConfigValid: boolean = false;

    private _config: Highcharts.Options | null = null;
    private _configPromise: Promise<Highcharts.Options> | null = null;
    private _data: SeriesData | null = null;
    private _dataPromise: Promise<SeriesData> | null = null;

    constructor({ id = uniqid.time(), config = null, data = null }: DVChartOptions = {}) {
        this.id = id;

        log.debug(`[chart='${this.id}'] new chart is created`);

        if (isPromise<Highcharts.Options>(config)) {
            this.setConfig(config);
        } else {
            this.config = config;
        }

        if (isPromise<SeriesData>(data)) {
            this.setData(data);
        } else  {
            this.data = data;
        }

        EventBus.$emit(CHART_CREATED, this);
    }

    set config(value: Highcharts.Options | null) {
        this._config = value;
        this._configPromise = null;

        log.debug(`[chart='${this.id}'] config value is set successfully`);

        this._validateConfig();
    }

    setConfig(value: Promise<Highcharts.Options>): void {
        log.debug(`[chart='${this.id}'] waiting for config promise to resolve`);

        this._configPromise = value;
        value.then(config => {
            if (value === this._configPromise) {
                this.config = config;
            }
        });
    }

    get config(): Highcharts.Options | null {
        return this._config;
    }

    set data(value: SeriesData | null) {
        this._data = value;
        this._dataPromise = null;

        log.debug(`[chart='${this.id}'] data value is set successfully`);

        this._validateConfig();
    }

    setData(value: Promise<SeriesData>): void {
        log.debug(`[chart='${this.id}'] waiting for data promise to resolve`);

        this._dataPromise = value;
        value.then(data => {
            if (value === this._dataPromise) {
                this.data = data;
            }
        });
    }

    get data(): SeriesData | null {
        return this._data;
    }

    update(): void {
        this._validateConfig();
    }

    private _validateConfig(): void {
        log.debug(`[chart='${this.id}'] attempting to validate config`);

        this._isConfigValid = false;

        if (!this.config) {
            // TODO: complain that chart config is missing

            log.warn(`[chart='${this.id}'] chart config is missing`);

            return;
        }

        if (!this.config.series) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            log.warn(`[chart='${this.id}'] charts series are missing`);

            return;
        }

        // if chart data is provided in a separate object, merge it into the config
        if (this.data) {
            if (this.data.length !== this.config.series.length) {
                // TODO: complain that series data supplied does not match chart config provided

                log.warn(`[chart='${this.id}'] provided data does not match chart series`);

                return;
            } else {
                // TODO: can we assume here that series data provided is of correct type
                this.data.forEach((seriesData, index) =>
                    (this.config!.series![index].data = seriesData as SeriesData));
            }
        }

        // check if all chart series have corresponding data object
        const isSeriesValid = this.config.series.some((series: Highcharts.IndividualSeriesOptions) =>
            typeof series.data !== 'undefined');

        if (!isSeriesValid) {
            // TODO: complain that chart config is incomplete and some of the data is missing

            log.warn(`[chart='${this.id}'] chart data is missing`);

            return;
        }

        log.debug(`[chart='${this.id}'] chart config is valid`);

        this._isConfigValid = true;
        EventBus.$emit(CHART_CONFIG_UPDATED, this);
    }

    get isConfigValid(): boolean {
        return this._isConfigValid;
    }
};