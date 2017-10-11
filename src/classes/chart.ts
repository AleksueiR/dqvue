import uniqid from 'uniqid';

import { isPromise } from './../utils';

interface DVChartOptions {
    id?: string,
    config?: object | Promise<string>,
    data?: object | Promise<object>
};

class DVChart {
    readonly id: string;

    private _config: object | null = null;
    private _configPromise: Promise<object> | null = null;
    private _data: object | null = null;
    private _dataPromise: Promise<object> | null = null;

    constructor({ id = uniqid.time(), config = null, data = null }: DVChartOptions = {}) {
        this.id = id;

        if (isPromise(config)) {
            this.setConfig(config);
        } else if (config !== null) {
            this.config = config;
        }

        if (isPromise(data)) {
            this.setData(data);
        } else if (data !== null) {
            this.data = data;
        }
    }

    set config(value: object | null) {
        this._config = value;
        this._configPromise = null;
    }

    setConfig(value: Promise<object>): void {
        this._configPromise = value;

        value.then(config => {
            if (value === this._configPromise) {
                this.config = config;
            }
        });
    }

    get config(): object | null {
        return this._config;
    }

    set data(value: object | null) {
        this._data = value;
        this._dataPromise = null;
    }

    setData(value: Promise<object>): void {
        this._dataPromise = value;

        value.then(data => {
            if (value === this._dataPromise) {
                this.data = data;
            }
        });
    }

    get data(): object | null {
        return this._data;
    }
}

/* const a = new DVChart();
console.log('---', a);
 */
export {
    DVChart,
    DVChartOptions
}