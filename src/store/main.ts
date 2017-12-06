import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';

import { sectionCreatedSubject, chartCreatedSubject } from './../observable-bus';

import { isString } from './../utils';

import { Subject } from 'rxjs/Subject';

const sections: { [name: string]: DVSection } = {};
const charts: { [name: string]: DVChart } = {};

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

sectionCreatedSubject.subscribe(addSection);
chartCreatedSubject.subscribe(addChart);

export { sections, charts };
