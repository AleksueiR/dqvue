import Vue from 'vue';

import DVSection from './classes/section';

window.addEventListener("load", event => {
    console.log('page loaded');

    const dvs = [];
    const nodes: NodeListOf<Element> = document.querySelectorAll('[dv-section]');

    const testTemplate =`
        <div id="app1" dv-section dv-data="dv1testData">
        >>> {{ message }} <<<

        </div>
    `;

    for (var i = 0; i < nodes.length; i++) {
        var element: HTMLElement = nodes[i] as HTMLElement;

        const dataAttr: string = element.attributes.getNamedItem('dv-data').value;
        const data: object = (<any>window)[dataAttr as string];

        const dv = new DVSection({ data, automount: element/* , template: testTemplate */ });

        console.log(element.attributes);
        console.log(element.attributes.getNamedItem('id').value);
        console.log(element.attributes.getNamedItem('dv-data').value);
        console.log(element.innerHTML);
    }
});