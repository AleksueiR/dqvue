<template>
    <div dv-section>
        <slot></slot>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Provide } from 'vue-property-decorator';

@Component
export default class Section extends Vue {
    // provide an undefined 'rootChartId'; this is needed to avoid the error of missing inject value on the chart table
    @Provide() rootChartId: string;
}
</script>

<style lang="scss" scoped>

</style>