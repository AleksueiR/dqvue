import Vue from 'vue';

import { DVSection, DVSectionOptions } from './classes/section';
import { contains } from './store/main';

const ID_ATTR = 'id';
const DV_DATA_ATTR = 'dv-data';
const DV_SECTION_ATTR = 'dv-section'

window.addEventListener('load', parsePage);

function parsePage(): void {
    const nodes: NodeListOf<Element> = document.querySelectorAll(`[${DV_SECTION_ATTR}]`);

    for (let i = 0; i < nodes.length; i++) {
        const element: HTMLElement = nodes[i] as HTMLElement;

        bootSectionDeclaration(element);
    }
}

function bootSectionDeclaration(element: HTMLElement): void {
    const sectionOptions: DVSectionOptions = {
        automount: element
    };

    const attributes: NamedNodeMap = element.attributes;

    // get data from the global scope
    const dataAttr: Attr = attributes.getNamedItem(DV_DATA_ATTR);
    if (dataAttr !== null) {
        sectionOptions.data = (<any>window)[dataAttr.value];
    }

    const idAttr: Attr = attributes.getNamedItem(ID_ATTR);
    if (idAttr !== null) {
        if (contains(idAttr.value)) {
            return;
        }

        sectionOptions.id = idAttr.value;
    }

    const dvsection: DVSection = new DVSection(sectionOptions);
}