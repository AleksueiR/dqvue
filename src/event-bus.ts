import Vue from 'vue';

const SECTION_CREATED = 'section-created';

const CHART_CREATED = 'chart-created';
const CHART_CONFIG_UPDATED = 'chart-config-updated';
const CHART_RENDERED = 'chart-rendered';

export const EventBus = new Vue();
export {
    SECTION_CREATED,

    CHART_CREATED,
    CHART_CONFIG_UPDATED,
    CHART_RENDERED
};