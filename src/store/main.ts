import { DVSection } from './../classes/section';
import { EventBus, SECTION_CREATED } from './../event-bus';

const sections: DVSection[] = [];

function addSection(section: DVSection):void {
    console.log(section);
    sections.push(section);
}

function removeSection(value: DVSection): void;
function removeSection(value: string): void;
function removeSection(value: any):void {
    // TODO: implement
}

function contains(value: DVSection): boolean
function contains(value: string): boolean
function contains(value: any): boolean {
    return sections.some(item => item === value || item.id === value);
}

EventBus.$on(SECTION_CREATED, (section: DVSection) => addSection(section));

export {
    // addSection,
    removeSection,
    contains,

    sections
};