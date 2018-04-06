<template>
    <div dv-section>
        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Provide, Inject } from 'vue-property-decorator';
import loglevel from 'loglevel';

import { sectionDestroyed, sectionDismounted, SectionDismountEvent } from '@/observable-bus';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/takeUntil';

const log: loglevel.Logger = loglevel.getLogger('dv-section');

@Component
export default class Section extends Vue {
    logMarker: string = `[section='${this.rootSectionId}']`;

    @Inject() rootSectionId: string;

    // provide an undefined 'rootChartId'; this is needed to avoid the error of missing inject value on the chart table
    @Provide() rootChartId: string;

    // a subject used to stop all other observable subscriptions
    deactivate: Subject<boolean> = new Subject<boolean>();

    // a flag indicating the section is manually dismounted only, but the parent section has not been destroyed yet
    dismountOnly: boolean = false;

    mounted(): void {
        // track dismount event and mark this components as dismounted when a corresponding event is fired
        sectionDismounted
            .filter((event: SectionDismountEvent) => event.sectionId === this.rootSectionId)
            .takeUntil(this.deactivate)
            .subscribe(event => (this.dismountOnly = event.dismountOnly));
    }

    beforeDestroy(): void {
        // deactivate all running subscriptions and unsubscribe from the deactivator subscription
        this.deactivate.next(true);
        this.deactivate.unsubscribe();

        if (!this.dismountOnly) {
            // push destroy even into the pipe
            sectionDestroyed.next({ sectionId: this.rootSectionId });

            log.info(`${this.logMarker} section component dismounted and destroyed`);
        } else {
            log.info(`${this.logMarker} section component dismounted only`);
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
