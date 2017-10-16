import * as Highcharts from 'highcharts';

import * as log from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';

export default {
    Highcharts,
    log,

    Section: DVSection,
    Chart: DVChart,

    get sections(): { [ name: string ]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [ name: string ]: DVChart } {
        return charts;
    }
};