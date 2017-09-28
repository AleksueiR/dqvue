import Vue from 'vue';

type StObFuPr = string | object | (() => object | Promise<object> ) | Promise<object>;

class DVInstance {
    private _template: string;
    private _data: object;
    private _chartConfig: object = {};
    private _chartData: object = {};

    private _mount: HTMLElement;
    private _isMounted: boolean = false;

    private _vm: Vue;

    constructor({ template, data, chartConfig, chartData }:
        { template: string, data: StObFuPr, chartConfig: StObFuPr, chartData: StObFuPr } =
        { template: '', data: {}, chartConfig: {}, chartData: {} }) {

            this._template = template;

            this.setData(data);

            // this._chartConfig = chartConfig;
            // this._chartData = chartData;
    }

    setData(data: StObFuPr): DVInstance {
        let realData: object | Promise<object> = {};

        if (isString(data)) {
            realData = (<any>window)[data as string];
        }

        if (isFunction(data)) {
            realData = data();
        }

        Promise.resolve(realData).then(resolvedData => {
            if (!isObject(resolvedData)) {
                // TODO:
                // throw error here since data is of unknown type
            }

            this._data = resolvedData;

            this.reMount();
        });

        return this;
    }

    get data(): object {

        return this._data;
    }

    private reMount() {
        if (!this._isMounted) {
            return;
        }

        this.mount(this._mount);
    }

    mount(element: HTMLElement) {
        if (this._mount !== element) {
            this._mount = element;
        }

        this._vm = new Vue({
            data: this.data
        });

        this._vm.$mount(this._mount);
    }
}

function isFunction(x: StObFuPr): x is (() => object | Promise<object>) {
    return typeof x === 'function';
}

function isString(x: StObFuPr): x is string {
    return typeof x === 'string';
}

function isObject(x: StObFuPr): x is object {
    return x === Object(x);
  }

export default DVInstance;