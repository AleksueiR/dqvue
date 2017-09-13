import Vue from 'vue';
import app from './app.vue';

import * as Highcharts from 'highcharts';

new Vue({
  el: '#app',
  template: '<app/>',
  components: { app }
});

// console.log('main', Highcharts);

export {
    Highcharts
}