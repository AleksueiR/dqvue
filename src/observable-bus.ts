import { Subject } from 'rxjs/Subject';

import { DVSection } from './classes/section';
import { DVChart } from './classes/chart';

const sectionCreatedSubject: Subject<DVSection> = new Subject<DVSection>();

type ChartRenderedEventType = { id: string; highchartObject: Highcharts.ChartObject };
type ChartViewDataClickEventType = {
    chartId: string;
    tableId: string | undefined;
    highchartObject: Highcharts.ChartObject;
};

type ChartTableCreatedEventType = { chartId: string; tableId: string };

const chartCreatedSubject: Subject<DVChart> = new Subject<DVChart>();
const chartConfigUpdatedSubject: Subject<DVChart> = new Subject<DVChart>();
const chartRenderedSubject: Subject<ChartRenderedEventType> = new Subject<ChartRenderedEventType>();
const chartTableCreatedSubject: Subject<ChartTableCreatedEventType> = new Subject<
    ChartTableCreatedEventType
>(); // TODO - ifx
const chartViewDataClickedSubject: Subject<ChartViewDataClickEventType> = new Subject<
    ChartViewDataClickEventType
>();

export {
    sectionCreatedSubject,
    chartCreatedSubject,
    chartConfigUpdatedSubject,
    chartRenderedSubject,
    chartTableCreatedSubject,
    chartViewDataClickedSubject,
    ChartTableCreatedEventType,
    ChartViewDataClickEventType,
    ChartRenderedEventType
};
