import Vue from 'vue';
import app from './components/app.vue';

import * as Highcharts from 'highcharts';

import './bootstrap';
import DVSection from './classes/section';

const a = new app();

/*new Vue({
    el: '#app',
    template: '<app/>',
    components: { app }
});*/




export {
    Highcharts,
    DVSection
};