import Vue from 'vue';

const SECTION_CREATED = 'section-created';
const SECTION_MOUNTED = 'section-mounted';

export const EventBus = new Vue();
export {
    SECTION_CREATED,
    SECTION_MOUNTED
}