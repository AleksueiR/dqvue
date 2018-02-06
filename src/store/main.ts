import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';

import {
    sectionCreated,
    chartCreated,
    sectionDestroyed,
    chartDestroyed,
    SectionCreatedEvent,
    ChartCreatedEvent
} from './../observable-bus';

import { isString } from './../utils';

import { Subject } from 'rxjs/Subject';

const sections: { [name: string]: DVSection } = {};
const charts: { [name: string]: DVChart } = {};

/**
 * Adds a DV Section to the reference container if another section with the same id does not exist.
 */
function addSection(event: SectionCreatedEvent): void {
    if (sections[event.sectionId]) {
        return;
    }

    sections[event.sectionId] = event.dvsection;
}

/**
 * Removes a reference to a DV Section from the global store.
 *
 * @param {SectionCreatedEvent} event
 */
function removeSection(event: SectionCreatedEvent): void {
    delete sections[event.sectionId];
}

/**
 * Adds a DV Chart to the reference container if another chart with the same id does not exist.
 */
function addChart(event: ChartCreatedEvent): void {
    if (charts[event.chartId]) {
        return;
    }

    charts[event.chartId] = event.dvchart;
}

/**
 * Removes a reference to a DV Chart from the global store.
 *
 * @param {ChartCreatedEvent} event
 */
function removeChart(event: ChartCreatedEvent): void {
    delete charts[event.chartId];
}

sectionCreated.subscribe(addSection);
chartCreated.subscribe(addChart);
sectionDestroyed.subscribe(removeSection);
chartDestroyed.subscribe(removeChart);

export { sections, charts };
