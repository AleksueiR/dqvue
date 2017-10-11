import Vue from 'vue';

import { DVSection, DVSectionOptions } from './classes/section';
import { DVChart, DVChartOptions } from './classes/chart';
import { contains, sections } from './store/main';

const ID_ATTR = 'id';
const DV_SECTION_DATA_ATTR = 'dv-data';
const DV_SECTION_ELEMENT = 'dv-section'

const DV_CHART_ELEMENT ='dv-chart';
const DV_CHART_CONFIG_ATTR ='dv-config';
const DV_CHART_DATA_ATTR ='dv-data';

// wait for the page to load; the dqv script can be placed at the top of the page and
// it won't find any sections declared below if executed immediately
window.addEventListener('load', parsePage);

function parsePage(): void {
    const sectionNodes: NodeListOf<Element> = document.querySelectorAll(DV_SECTION_ELEMENT);

    for (let i = 0; i < sectionNodes.length; i++) {
        const sectionNode: HTMLElement = sectionNodes[i] as HTMLElement;

        // find all the charts declared inside a section and boot them first
        const chartNodes: NodeListOf<Element> = sectionNode.querySelectorAll(DV_CHART_ELEMENT);
        let charts: { [name: string]: DVChart } | undefined = undefined;
        if (chartNodes.length > 0) {
            charts = {};

            for (let i = 0; i < chartNodes.length; i++) {
                let chartNode: HTMLElement = chartNodes[i] as HTMLElement;

                const dvchart = bootChartDeclaration(chartNode);
                charts[dvchart.id] = dvchart;
            }
        }

        bootSectionDeclaration(sectionNode, charts);
    }
}

function bootSectionDeclaration(sectionNode: HTMLElement, charts?: { [name: string]: DVChart }): DVSection {
    const sectionOptions: DVSectionOptions = {
        automount: sectionNode,
        charts
    };

    const attributes: NamedNodeMap = sectionNode.attributes;

    // get data from the global scope
    const dataAttr: Attr = attributes.getNamedItem(DV_SECTION_DATA_ATTR);
    if (dataAttr !== null) {
        sectionOptions.data = (<any>window)[dataAttr.value];
    }

    const idAttr: Attr = attributes.getNamedItem(ID_ATTR);
    if (idAttr !== null) {
        if (contains(idAttr.value)) {
            return sections[idAttr.value];
        }

        sectionOptions.id = idAttr.value;
    }

    const dvsection: DVSection = new DVSection(sectionOptions);

    if (idAttr === null) {
        sectionNode.setAttribute(ID_ATTR, dvsection.id);
    }

    return dvsection;
}

function bootChartDeclaration(chartNode: HTMLElement): DVChart {
    const chartOptions: DVChartOptions = {};

    const attributes: NamedNodeMap = chartNode.attributes;

    // get data from the global scope
    const configAttr: Attr = attributes.getNamedItem(DV_CHART_CONFIG_ATTR);
    if (configAttr !== null) {
        chartOptions.config = (<any>window)[configAttr.value];
    }

    const dataAttr: Attr = attributes.getNamedItem(DV_CHART_DATA_ATTR);
    if (dataAttr !== null) {
        chartOptions.data = (<any>window)[dataAttr.value];
    }

    const idAttr: Attr = attributes.getNamedItem(ID_ATTR);
    if (idAttr !== null) {
        chartOptions.id = idAttr.value;
    }

    const dvchart: DVChart = new DVChart(chartOptions);

    if (idAttr === null) {
        chartNode.setAttribute(ID_ATTR, dvchart.id);
    }

    return dvchart;
}

export {
    parsePage
};