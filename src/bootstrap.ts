import uniqid from 'uniqid';

import { DVSection, DVSectionOptions } from './classes/section';
import { DVChart, DVChartOptions } from './classes/chart';
import { sections, charts } from './store/main';

const ID_ATTR = 'id';
const DV_SECTION_DATA_ATTR = 'dv-data';
const DV_SECTION_ELEMENT = 'dv-section';
// const DV_SECTION_WAIT_ATTR = 'dv-wait';

const DV_CHART_ELEMENT = 'dv-chart';
const DV_CHART_CONFIG_ATTR = 'dv-config';
const DV_CHART_DATA_ATTR = 'dv-data';

// wait for the page to load; the dqv script can be placed at the top of the page and
// it won't find any sections declared below if executed immediately
window.addEventListener('load', parsePage);

/**
 * Reads the page and instantiates any DV Sections declared on the page which are not yet present in `DQV.sections`.
 */
function parsePage(): void {
    // find all the `dv-section` nodes
    const sectionNodes: NodeListOf<Element> = document.querySelectorAll(DV_SECTION_ELEMENT);

    for (let i = 0; i < sectionNodes.length; i++) {
        const sectionNode: HTMLElement = sectionNodes[i] as HTMLElement;

        // find all the `dv-chart` nodes declared inside a section and boot them first
        const chartNodes: NodeListOf<Element> = sectionNode.querySelectorAll(DV_CHART_ELEMENT);

        if (chartNodes.length > 0) {
            for (let i = 0; i < chartNodes.length; i++) {
                let chartNode: HTMLElement = chartNodes[i] as HTMLElement;

                const dvchart = bootChartDeclaration(chartNode);
            }
        }

        // boot the section itself; all referenced charts should be booted already
        bootSectionDeclaration(sectionNode);
    }
}

/**
 * Creates and returns a DV Section from the DOM node provided and a collection of DV Chart objects.
 * If the DV Section on the supplied node is already initialized (it's present on `DQV.sections`), no new sections will be created, and the existing object will be returned instead.
 */
function bootSectionDeclaration(sectionNode: HTMLElement): DVSection {
    // scrape all attributes from the node
    const attributes: NamedNodeMap = sectionNode.attributes;

    // get section id; if not provided, it will be auto-generated
    const idAttr: Attr = attributes.getNamedItem(ID_ATTR);
    let idValue: string = uniqid.time();
    if (idAttr !== null) {
        if (sections[idAttr.value]) {
            return sections[idAttr.value];
        }

        idValue = idAttr.value;
    }

    const sectionOptions: DVSectionOptions = {
        id: idValue,
        mount: sectionNode
    };

    // get data from the global scope
    const dataAttr: Attr = attributes.getNamedItem(DV_SECTION_DATA_ATTR);
    if (dataAttr !== null) {
        // TODO: enforce data being either an object or a Promise; no functions allowed
        sectionOptions.data = (<any>window)[dataAttr.value];
    }

    // get data from the global scope
    /* const waitAttr: Attr = attributes.getNamedItem(DV_SECTION_WAIT_ATTR);
    if (waitAttr !== null) {
        // TODO: enforce data being either an object or a Promise; no functions allowed
        sectionOptions.automount = false;
    } */

    const dvsection: DVSection = new DVSection(sectionOptions);

    return dvsection;
}

/**
 * Creates and returns a DV Chart from the DOM node provided.
 * If the DV Chart on the supplied node is already initialized (it's present on `DQV.charts`), no new charts will be created, and the existing object will be returned instead.
 */
function bootChartDeclaration(chartNode: HTMLElement): DVChart {
    const chartOptions: DVChartOptions = {};

    // scrape all attributes from the node
    const attributes: NamedNodeMap = chartNode.attributes;

    // get config from the global scope
    const configAttr: Attr = attributes.getNamedItem(DV_CHART_CONFIG_ATTR);
    if (configAttr !== null) {
        // TODO: enforce config being either an object or a Promise; no functions allowed
        chartOptions.config = (<any>window)[configAttr.value];
    }

    // get data from the global scope
    const dataAttr: Attr = attributes.getNamedItem(DV_CHART_DATA_ATTR);
    if (dataAttr !== null) {
        // TODO: enforce data being either an object or a Promise; no functions allowed
        chartOptions.data = (<any>window)[dataAttr.value];
    }

    // get section id; if not provided, it will be auto-generated
    const idAttr: Attr = attributes.getNamedItem(ID_ATTR);
    if (idAttr !== null) {
        if (charts[idAttr.value]) {
            return charts[idAttr.value];
        }

        chartOptions.id = idAttr.value;
    }

    const dvchart: DVChart = new DVChart(chartOptions);

    // if id was not provided, set the id attribute to the generated value for future reference
    // this is needed to link declarative charts with their respective config objects
    // when creating DV Charts programmatically, the DV Section template must have charts' ids already in place
    if (idAttr === null) {
        chartNode.setAttribute(ID_ATTR, dvchart.id);
    }

    return dvchart;
}

export { parsePage };
