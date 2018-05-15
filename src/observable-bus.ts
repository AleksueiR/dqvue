import { Subject } from 'rxjs/Subject';

import { DVHighcharts } from './api/main';

import { DVSection } from './classes/section';
import { DVChart } from './classes/chart';

// #region chart events

export interface ChartEvent {
    chartId: string;
    dvchart: DVChart;
}

export interface ChartCreatedEvent extends ChartEvent {}

export interface ChartDestroyedEvent extends ChartEvent {}

export interface ChartRenderedEvent extends ChartEvent {
    highchartObject: DVHighcharts.ChartObject;
}

export interface ChartConfigUpdatedEvent extends ChartEvent {}

export interface ChartViewDataEvent extends ChartEvent {}

export interface ChartSetExtremesEvent extends ChartEvent {
    axis: 'xAxis' | 'yAxis';
    max: number;
    min: number;
}

export const chartCreated: Subject<ChartCreatedEvent> = new Subject<ChartCreatedEvent>();
export const chartDestroyed: Subject<ChartDestroyedEvent> = new Subject<ChartDestroyedEvent>();
export const chartRendered: Subject<ChartRenderedEvent> = new Subject<ChartRenderedEvent>();
export const chartConfigUpdated: Subject<ChartConfigUpdatedEvent> = new Subject<
    ChartConfigUpdatedEvent
>();
export const chartViewData: Subject<ChartViewDataEvent> = new Subject<ChartViewDataEvent>();
export const chartSetExtremes: Subject<ChartSetExtremesEvent> = new Subject<
    ChartSetExtremesEvent
>();

// #endregion

// #region section events

export interface SectionEvent {
    sectionId: string;
}

export interface SectionCreatedEvent extends SectionEvent {
    dvsection: DVSection;
}

export interface SectionDestroyedEvent extends SectionEvent {}

export interface SectionDismountEvent extends SectionEvent {
    dismountOnly: boolean;
}

export const sectionCreated: Subject<SectionCreatedEvent> = new Subject<SectionCreatedEvent>();
export const sectionDestroyed: Subject<SectionDestroyedEvent> = new Subject<
    SectionDestroyedEvent
>();
export const sectionDismounted: Subject<SectionDismountEvent> = new Subject<SectionDismountEvent>();

// #endregion
