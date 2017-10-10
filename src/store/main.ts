import { DVSection } from './../classes/section';
import { EventBus, SECTION_CREATED } from './../event-bus';

import { isString } from './../utils';

const sections: { [ name: string ]: DVSection } = {};

function addSection(section: DVSection):void {
    if (!contains(section)) {
        sections[section.id] = section;
    }
}

function removeSection(value: DVSection): void;
function removeSection(value: string): void;
function removeSection(value: any):void {
    // TODO: implement
}

function contains(value: DVSection): boolean
function contains(value: string): boolean
function contains(value: any): boolean {
    return typeof sections[isString(value) ? value : value.id] !== 'undefined';
}

EventBus.$on(SECTION_CREATED, (section: DVSection) => addSection(section));

export {
    // addSection,
    removeSection,
    contains,

    sections
};