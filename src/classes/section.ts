import Vue from 'vue';
import loglevel from 'loglevel';

import Section from './../components/section.vue';
import { DVChart } from './chart';
import Chart from './../components/chart.vue';
import ChartTable from './../components/chart-table.vue';

import { sectionCreatedSubject } from './../observable-bus';

import { isPromise, isFunction, isString, isObject } from './../utils';
// TODO: constrain logging to 'warn' in production builds
// TODO: add a runtime `debug` switch to enable full logging

const log: loglevel.Logger = loglevel.getLogger('dv-section');

export interface DVSectionOptions {
    id: string;
    template?: string | Promise<string>;
    data?: object | Promise<object>;
    mount?: HTMLElement;
    automount?: boolean;
}

export class DVSection {
    readonly id: string;

    private _mount: HTMLElement | null = null;
    private _automount: boolean;
    private _isMounted: boolean = false;

    private _vm: Vue;

    private _template: string | null = null;
    private _templatePromise: Promise<string> | null = null;
    private _data: object | null = null;
    private _dataPromise: Promise<object> | null = null;

    constructor({
        id,
        template = null,
        data = null,
        mount = null,
        automount = true
    }: DVSectionOptions) {
        this.id = id;

        log.info(`[section='${this.id}'] new section is created`);

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

        // push the new section through the stream
        sectionCreatedSubject.next(this);

        if (mount) {
            this._mount = mount;
        }

        this._automount = automount;
        if (this._automount) {
            log.info(`[section='${this.id}'] attempting automount`);
            this.mount();
        }
    }

    /**
     * Deprecated - charts no longer need to be added directly to the sections
     *
     * --- Adds one or several `DVChart` objects to this `DVSection` to be referenced by the section's template.
     * --- Existing charts with the same ids will be overwritten.
     */
    addChart(): void {}

    get charts(): { [name: string]: DVChart } {
        // TODO: find all the DVCharts mentioned in the current section and return them.
        return {};
    }

    set template(value: string | null) {
        this._template = value;
        this._templatePromise = null;

        log.info(`[section='${this.id}'] template value is set successfully`);

        // only attempt to remount if the mount element is already specified
        if (this._mount) {
            this.remount();
        }
    }

    setTemplate(value: Promise<string>): DVSection {
        log.info(`[section='${this.id}'] waiting for template promise to resolve`);

        this._templatePromise = value;
        value.then(template => {
            if (value === this._templatePromise) {
                this.template = template;
            }
        });

        return this;
    }

    get template(): string | null {
        // if no explicit template is provided or promised, use the inline template if present
        if (!this._template && !this._templatePromise && this._isInlineTemplate) {
            log.info(`[section='${this.id}'] no template provided; using inline template`);

            // `_isInlineTemplate` assures `this._mount` is defined
            const mount = <HTMLElement>this._mount;
            const inlineTemplate = mount.outerHTML.trim();

            // expunge the mount's guts
            while (mount.firstChild) {
                mount.removeChild(mount.firstChild);
            }

            this._template = inlineTemplate;
        }

        return this._template;
    }

    set data(value: object | null) {
        this._data = value;
        this._dataPromise = null;

        log.info(`[section='${this.id}'] data value is set successfully`);

        // only attempt to remount if the mount element is already specified
        if (this._mount) {
            this.remount();
        }
    }

    setData(value: Promise<object>): DVSection {
        log.info(`[section='${this.id}'] waiting for data promise to resolve`);

        this._dataPromise = value;
        value.then(data => {
            if (value === this._dataPromise) {
                this.data = data;
            }
        });

        return this;
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

    private get _isMountable(): boolean {
        if (!this.template) {
            return false;
        }

        // a section can be mounted without a data object if the template doesn't reference anything on the data object
        // however, if there exists a data promise and no data object is yet defined, do not mount just yet
        if (!this.data && this._dataPromise) {
            return false;
        }

        if (!this.data && !this._dataPromise) {
            log.info(
                `[section='${
                    this.id
                }'] no data provided; if template uses bindings, mounting the section will throw errors`
            );
        }

        // TODO: check for charts present and their configs

        return true;
    }

    mount(element?: HTMLElement): DVSection {
        if (element) {
            this._mount = element;
        }

        log.info(`[section='${this.id}'] attempting to mount`);

        if (!this._mount) {
            // TODO: complain in the console that a mount element needs to be provided

            log.warn(`[section='${this.id}'] cannot mount - the mount point is not provided`);

            return this;
        }

        if (this._isMounted) {
            // TODO: complain in the console that instance is already mounted; dismount first

            log.warn(`[section='${this.id}'] cannot mount - already mounted`);

            return this;
        }

        if (!this._isMountable) {
            // TODO: complain in the console that it's not possible to mount the section because either data or template is missing.

            log.warn(`[section='${this.id}'] cannot mount - either template or data is missing `);

            return this;
        }

        // TODO: if the section is created with an explicit template and is not provided DV chart object, mounting such sections will result in errors as there will be no DV Chart object for corresponding markup in the template
        // it possible to add some checks to ensure the DV Chart objects are supplied before mounting the section
        // as an alternative, the template can be parsed and all missing DV Chart object can be created and stored on this DV Section; they will be accessible through the API and this will not cause any errors when mounting - the charts will not be rendered until their config data is supplied
        // the easiest way to parse the chart is to not use regex, but `insertAdjacentHTML` and then `bootChartDeclaration` from the bootstrap module
        // el = document.createElement('div'); el.insertAdjacentHTML('afterbegin', '<div></div>'); el.querySelectorAll('dv-section')
        this._vm = new Vue({
            template: <string>this.template,
            data: <object>this.data || {}, // if no data object is provided, return an empty object
            provide: {
                rootSectionId: this.id
            },
            components: {
                'dv-section': Section,
                'dv-chart': Chart,
                'dv-chart-table': ChartTable
            }
        });

        this._vm.$mount(this._mount);
        this._mount = this._vm.$el; // the mount element has been replaced by the _vm.$el, reassign
        this._isMounted = true;

        // when an explicit template is provided, it might not have the `id` attribute set; setting it manually
        this._vm.$el.setAttribute('id', this.id);

        log.info(`[section='${this.id}'] mounted successfully on`, this._mount);

        return this;
    }

    destroy(): DVSection {
        log.info(`[section='${this.id}'] attempting to destroy`);

        if (!this._mount) {
            // TODO: complain in the console that you can't destroy a not yet mounted instance

            log.warn(`[section='${this.id}'] cannot destroy - the section is not mounted`);

            return this;
        }

        this.dismount();

        // .remove() is not supported in IE
        this._mount.parentNode!.removeChild(this._mount);
        this._mount = null;

        log.info(`[section='${this.id}'] destroyed successfully`);

        return this;
    }

    dismount(clear: boolean = true): DVSection {
        log.info(`[section='${this.id}'] attempting to dismount`);

        if (!this._mount) {
            log.warn(`[section='${this.id}'] cannot dismount - the section is not mounted`);

            return this;
        }

        // TODO: when dismouning a section, remove all the chart tables originating from charts in this section, even ones that are in different sections
        this._vm.$destroy();
        this._isMounted = false;

        // removing guts of the section but leaving the mount element
        while (this._mount.firstChild) {
            this._mount.removeChild(this._mount.firstChild);
        }

        log.info(`[section='${this.id}'] dismounted successfully`);

        return this;
    }

    remount(): DVSection {
        log.info(`[section='${this.id}'] attempting to re-mount`);

        if (!this._mount) {
            log.warn(`[section='${this.id}'] cannot re-mount - this section is not mounted`);

            return this;
        }

        // if already mounted, dismount first, then mount back up
        // not yet mounted sections with mount elements already specified are waiting for `template` or `data` to be resolved
        if (this._isMounted) {
            this.dismount();
        } else if (!this._automount) {
            log.info(`[section='${this.id}'] cannot re-mount - automount is disabled`);

            return this;
        }

        this.mount(this._mount);

        return this;
    }

    /* duplicate(): DVSection {
        log.info(`[section='${this.id}'] attempting to duplicate`);

        // TODO: implement

        log.info(`[section='${this.id}'] duplicated successfully`);

        return this;
    } */
}
