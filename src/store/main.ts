import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { EventBus, SECTION_CREATED } from './../event-bus';

import { isString } from './../utils';

const sections: { [ name: string ]: DVSection } = {};
const charts: { [ name: string ]: DVChart } = {};

/**
 * Adds a DV Section to the reference container if another section with the same id does not exist.
 */
function addSection(section: DVSection): void {
    if (sections[section.id]) {
        return;
    }

    sections[section.id] = section;
}

/**
 * Adds a DV Chart to the reference container if another chart with the same id does not exist.
 */
function addChart(chart: DVChart): void {
    if (charts[chart.id]) {
        return;
    }

    charts[chart.id] = chart;
}

EventBus.$on(SECTION_CREATED, (section: DVSection) => addSection(section));
EventBus.$on(SECTION_CREATED, (chart: DVChart) => addChart(chart));

export {
    sections,
    charts
};