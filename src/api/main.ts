import Highcharts from 'highcharts';

import loglevel from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';

import { sectionCreated, chartCreated } from './../observable-bus';

import { Observable } from 'rxjs/Observable';

const version = require('./../../package.json').version;
const log: loglevel.Logger = loglevel.getLogger('DQV');

interface EnhancedWindow extends Window {
    Highcharts: typeof Highcharts;
}

let hc: typeof Highcharts;

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
    export interface ChartObject extends Highcharts.ChartObject {
        // https://api.highcharts.com/highcharts/chart.resetZoomButton
        resetZoomButton: Highcharts.ElementObject | undefined;
        showResetZoom: () => void;

        // `getTable` is not included in default Highcharts types
        getTable?: () => string;
    }

    export interface ChartOptions extends Highcharts.ChartOptions {
        zoomSlider?: noUiSlider.Options;
    }

    export interface AxisObject extends Highcharts.AxisObject {
        // https://api.highcharts.com/highcharts/xAxis.minRange
        minRange: number;
    }

    // https://api.highcharts.com/highcharts/exporting.menuItemDefinitions
    export interface MenuItem extends Highcharts.MenuItem {
        text: string;
        onclick: (highchartObject?: Highcharts.ChartObject) => void;
    }
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

    get sections(): { [name: string]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [name: string]: DVChart } {
        return charts;
    }
};
