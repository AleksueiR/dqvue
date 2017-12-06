import { Subject } from 'rxjs/Subject';

import { DVSection } from './classes/section';
import { DVChart } from './classes/chart';

const sectionCreatedSubject: Subject<DVSection> = new Subject<DVSection>();

type ChartRenderedEventType = { id: string; highchartObject: Highcharts.ChartObject };

const chartCreatedSubject: Subject<DVChart> = new Subject<DVChart>();
const chartConfigUpdatedSubject: Subject<DVChart> = new Subject<DVChart>();
const chartRenderedSubject: Subject<ChartRenderedEventType> = new Subject<ChartRenderedEventType>();
const chartTableCreatedSubject: Subject<any> = new Subject<any>(); // TODO - ifx

export {
    sectionCreatedSubject,
    chartCreatedSubject,
    chartConfigUpdatedSubject,
    chartRenderedSubject,
    chartTableCreatedSubject,
    ChartRenderedEventType
};
