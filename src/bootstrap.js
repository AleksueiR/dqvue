import Vue from 'vue';

import DVInstance from './dv.class';

window.addEventListener("load", event => {
    console.log('page loaded');

    const dv1 = new DVInstance({ data: 'dv1testData' });
    const dv2 = new DVInstance({ data: 'dv2testData' });
    const dv3 = new DVInstance({ data: 'dv3testData' });

    setTimeout(function() {
        dv1.mount(document.getElementById('app1'));
        dv2.mount(document.getElementById('app2'));
        dv3.mount(document.getElementById('app3'));
    }, 100);
});