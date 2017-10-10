import * as Highcharts from 'highcharts';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections } from './../store/main';

export default {
    Highcharts,

    Section: DVSection,
    Chart: DVChart,

    get sections(): { [ name: string ]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    }
};