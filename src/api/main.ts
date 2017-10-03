import * as Highcharts from 'highcharts';

import { DVSection } from './../classes/section';
import { sections } from './../store/main';

export default {
    Highcharts,

    Section: DVSection,

    get sections(): DVSection[] {
        return (<DVSection[]>[]).concat(sections);
    }
};