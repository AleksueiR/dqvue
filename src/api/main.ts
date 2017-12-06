import Highcharts from 'highcharts';

import loglevel from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';

import { sectionCreatedSubject, chartCreatedSubject } from './../observable-bus';

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

    sectionCreated: sectionCreatedSubject.asObservable(),
    chartCreated: chartCreatedSubject.asObservable(),

    get sections(): { [name: string]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [name: string]: DVChart } {
        return charts;
    }
};
