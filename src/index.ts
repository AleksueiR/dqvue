import Vue from 'vue';
import app from './components/app.vue';

import * as Highcharts from 'highcharts';

import './bootstrap';
import DVInstance from './dv.class';

const a = new app();

/*new Vue({
    el: '#app',
    template: '<app/>',
    components: { app }
});*/




export {
    Highcharts,
    DVInstance
};