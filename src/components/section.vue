<template>
    <div dv-section>
        <slot></slot>
    </div>
</template>

<script lang='ts'>

import { Vue, Component } from 'vue-property-decorator';

@Component
export default class Section extends Vue { };

</script>

<style lang="scss" scoped>

</style>