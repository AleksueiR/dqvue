<template>
    <div dv-section>
        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Provide, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';

import { sectionDestroyed, SectionDestroyedEvent } from './../observable-bus';

const log: loglevel.Logger = loglevel.getLogger('dv-section');

@Component
export default class Section extends Vue {
    logMarker: string = `[section='${this.rootSectionId}']`;

    @Inject() rootSectionId: string;

    // provide an undefined 'rootChartId'; this is needed to avoid the error of missing inject value on the chart table
    @Provide() rootChartId: string;

    beforeDestroy(): void {
        // push destroy even into the pipe
        sectionDestroyed.next({ sectionId: this.rootSectionId });

        log.info(`${this.logMarker} section component destroyed`);
    }
}
</script>

<style lang="scss" scoped>

</style>
