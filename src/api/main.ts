import Highcharts from 'highcharts';

import loglevel from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';
import { langObjects } from '../lang';

import {
    sectionCreated,
    chartCreated,
    sectionDestroyed,
    chartDestroyed
} from './../observable-bus';

import { Observable } from 'rxjs/Observable';

const version = require('./../../package.json').version;
const log: loglevel.Logger = loglevel.getLogger('DQV');

interface EnhancedWindow extends Window {
    Highcharts: typeof Highcharts;
}

let hc: typeof Highcharts;
let lang: string = 'en';

function importHighcharts(): void {
    if ((<EnhancedWindow>window).Highcharts) {
        hc = (<EnhancedWindow>window).Highcharts;

        log.info(`[DQV] using globally defined Highcharts (${(<any>hc).version})`);
    } else {
        log.error(`[DQV] Highcharts is not defined; please load Highcharts first`);
        throw new Error(`[DQV] Highcharts is not defined`);
    }
}

// semi-public functionality not exposed on the HC declarations
export namespace DVHighcharts {
    export interface Options extends Highcharts.Options {
        exporting: ExportingOptions;
    }

    export interface ExportingOptions extends Highcharts.ExportingOptions {
        // `menuItemDefinitions` is not included in the `ExportingOptions` type
        menuItemDefinitions: { [name: string]: MenuItem | null };
    }

    export interface ChartObject extends Highcharts.ChartObject {
        // https://api.highcharts.com/highcharts/chart.resetZoomButton
        resetZoomButton: Highcharts.ElementObject | undefined;
        showResetZoom: () => void;

        // `getTable` is not included in default Highcharts types
        getTable?: () => string;
    }

    export interface ChartOptions extends Highcharts.ChartOptions {
        zoomSlider?: DQVSliderOptions;
    }

    export interface AxisObject extends Highcharts.AxisObject {
        // https://api.highcharts.com/highcharts/xAxis.minRange
        minRange: number;
    }

    export interface AxisEvent extends Highcharts.AxisEvent {}

    // https://api.highcharts.com/highcharts/exporting.menuItemDefinitions
    export interface MenuItem extends Highcharts.MenuItem {
        text: string;
        onclick: (highchartObject?: Highcharts.ChartObject) => void;
    }
}

export interface DQVSliderOptions extends noUiSlider.Options {
    // labels for the slider input fields
    labels?: string[];
}

export default {
    get Highcharts(): typeof Highcharts {
        if (hc) {
            return hc;
        }

        importHighcharts();
        return hc;
    },

    loglevel,
    version,

    Section: DVSection,
    Chart: DVChart,

    sectionCreated: sectionCreated.asObservable(),
    chartCreated: chartCreated.asObservable(),
    sectionDestroyed: sectionDestroyed.asObservable(),
    chartDestroyed: chartDestroyed.asObservable(),

    get sections(): { [name: string]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [name: string]: DVChart } {
        return charts;
    },

    set language(newLang: string) {
        if (newLang !== 'en' && newLang !== 'fr') {
            console.error(
                "DQV does not support that language. We support 'en' (English/Anglais) and 'fr' (French/Francais)"
            );
            return;
        }
        lang = newLang;
        hc.setOptions((<any>langObjects)[lang]);
    },

    get language(): string {
        return lang;
    }
};
