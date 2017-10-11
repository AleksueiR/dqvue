import Vue from 'vue';
import uniqid from 'uniqid';

import Section from './../components/section.vue';
import { DVChart } from './chart';
import Chart from './../components/chart.vue';
import { EventBus, SECTION_CREATED } from './../event-bus';

import { isPromise, isFunction, isString, isObject } from './../utils';

interface DVSectionOptions {
    id?: string,
    template?: string | Promise<string>,
    data?: object | Promise<object>,
    charts?: { [ name: string ]: DVChart },
    automount?: HTMLElement
};

class DVSection {

    readonly id: string;

    private _mount: HTMLElement | null = null;
    private _isMounted: boolean = false;

    private _vm: Vue;

    private _template: string | null = null;
    private _templatePromise: Promise<string> | null = null;
    private _data: object | null = null;
    private _dataPromise: Promise<object> | null = null;

    private _charts: { [name: string]: DVChart } = {};

    constructor({ id = uniqid.time(), template = null, data = null, charts = {}, automount }: DVSectionOptions = {}) {
        this.id = id;

        if (isString(template)) {
            this.template = template;
        } else if (template !== null) {
            this.setTemplate(template);
        }

        if (isPromise(data)) {
            this.setData(data);
        } else if (data !== null) {
            this.data = data;
        }

        this.charts = charts;

        EventBus.$emit(SECTION_CREATED, this);

        if (automount) {
            this.mount(automount);
        }
    }

    addChart(items: DVChart):void;
    addChart(items: DVChart[]):void;
    addChart(items: any):void {

        if (!Array.isArray(items)) {
            items = [items];
        }

        // TODO: do we ever need to remove charts?
        // Do we care if we override an already existing chart
        items.forEach((item: DVChart) =>
            this._charts[item.id] = item);
    }

    set charts(items: { [name: string]: DVChart }) {
        this._charts = items;
    }

    get charts(): { [name: string]: DVChart } {
        return this._charts;
    }

    set template(value: string | null) {
        this._template = value;
        this._templatePromise = null;
        this.remount();
    }

    setTemplate(value: Promise<string>):void {
        this._templatePromise = value;
        value.then(template => {
            if (value === this._templatePromise) {
                this.template = template;
            }
        });
    }

    get template(): string | null {
        return this._template;
    }

    set data(value: object | null) {
        this._data = value;
        this._dataPromise = null;
        this.remount();
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

    private get _isInlineTemplate(): boolean {
        if (!this._mount) {
            return false;
        }

        return this._mount.innerHTML.trim() !== '';
    }

    private get _isMountable():boolean {
        if (!this.template && !this._isInlineTemplate) {
            return false;
        }

        if (!this.data) {
            return false;
        }

        // TODO: check for charts present and their configs

        return true;
    }

    mount(element: HTMLElement): DVSection {
        if (!element) {
            // TODO: complain in the console that a mount element needs to be provided

            return this;
        }

        if (this._isMounted) {
            // TODO: complain in the console that instance is already mounted; dismount first

            return this;
        }

        if (this._mount !== element) {
            this._mount = element;
        }

        if (!this._isMountable) {
            // TODO: complain in the console that it's not possible to mount the section because either data or template is missing.

            return this;
        }

        this._vm = new Vue({
            template: <string>this.template,
            computed: { charts: () => this.charts },
            data: <object>this.data,
            provide: {
                charts: this.charts
            },
            components: {
                'dv-section': Section,
                'dv-chart': Chart
            }
        });

        this._vm.$mount(this._mount);
        this._mount = this._vm.$el; // the mount element has been replaced by the _vm.$el, reassign
        this._isMounted = true;

        // this._vm.$el.setAttribute('id', this.id);

        /* if (this.template) {
            this._vm.$el.setAttribute('dv-section', '');
        } */

        return this;
    }

    destroy(): DVSection {
        if (!this._mount) {
            // TODO: complain in the console that you can't destroy a not yet mounted instance

            return this;
        }

        this.dismount();

        this._mount.remove();
        this._mount = null;

        return this;
    }

    dismount(clear: boolean = true): DVSection {
        if (!this._mount) {
            // TODO: complain in the console that you can't dismount a not yet mounted instance

            return this;
        }

        this._vm.$destroy();
        this._isMounted = false;

        // removing guts of the section but leaving the mount element
        while (this._mount.firstChild) {
            this._mount.removeChild(this._mount.firstChild);
        }

        return this;
    }

    remount(): DVSection {
        if (!this._mount) {
            // TODO: complain in the console that you can't remount a not yet mounted instance

            return this;
        }

        // if not yet mounted but having mount element specified means the instance was waiting for `template` or `data` to be resolved
        // try to mount normally
        if (!this._isMounted) {
            this.mount(this._mount);

            return this;
        }

        this.dismount().mount(this._mount);

        return this;
    }

    duplicate(): DVSection {
        // TODO: implement

        return this;
    }
}

export {
    DVSection,
    DVSectionOptions
};