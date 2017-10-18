import assert from 'assert';

import { DVSection } from '../../src/classes/section';
import { parsePage } from './../../src/bootstrap';
import api from './../../src/api/main';

interface EnhancedWindow extends Window {
    DQV: {
        Section: any,
        Chart: any,
        sections: { [name: string]: DVSection }
    },

    [key: string]: any
};

// the following can be used to prep the page before running tests
/* beforeEach(function () {
    window.addEventListener('load', () => {
        console.log('loaded');
    });

    var fixture = `
        <div id="fixture">
            <dv-section>
                {{ message }}
            </dv-section>
        </div>
    `;

    document.body.insertAdjacentHTML(
        'afterbegin',
        fixture);
});

 */

describe('declarative', () => {

    // remove the html fixture from the DOM
    afterEach(() => {
        const node = document.getElementById('fixture');
        document.body.removeChild(node as HTMLElement);
    });

    function injectFixtures(fixtureTemplate: string, dataObj: { [name: string]: object } = {}): void {
        document.body.insertAdjacentHTML('afterbegin', `<div id="fixture">${fixtureTemplate}</div>`);

        Object.keys(dataObj).forEach((key: string) =>
            ((<EnhancedWindow>window)[key] = dataObj[key]));
    }

    it('simple section - sync data', () => {
        const dv1id = 'dv1';
        const dv1template1 = `
            <dv-section dv-data="dv1data1" id="${dv1id}">
                <span class="message">{{ message }}</span>
            </dv-section>
        `;
        const dv1data1 = {
            message: 'hello there'
        };

        // inject html into the page
        injectFixtures(dv1template1, { dv1data1 });

        // since the page has already loaded, trigger the page parse manually
        parsePage();

        // get the section by id
        const dvsection = api.sections[dv1id];

        let dv1node: HTMLElement = document.getElementById(dv1id) as HTMLElement;
        let messageNode: HTMLElement = dv1node.querySelector('.message') as HTMLElement;

        assert(dvsection.id === dv1id);
        assert(dv1node.getAttribute('id') === dv1id);
        assert(messageNode.innerHTML.trim() === dv1data1.message);

        dvsection.dismount();
        assert(dv1node.innerHTML.trim() === '');

        dvsection.remount();

        // remounting will replace the mount point, so need to get it again
        dv1node = document.getElementById(dv1id) as HTMLElement;
        messageNode = dv1node.querySelector('.message') as HTMLElement;
        assert(messageNode.innerHTML.trim() === dv1data1.message);

        // replacing the data object will remount the instance
        const dv1data2 = { message: 'new message' };
        dvsection.data = dv1data2;

        // remounting will replace the mount point, so need to get it again
        dv1node = document.getElementById(dv1id) as HTMLElement;
        messageNode = dv1node.querySelector('.message') as HTMLElement;
        assert(messageNode.innerHTML.trim() === dv1data2.message);

        dvsection.destroy();
        dv1node = document.getElementById(dv1id) as HTMLElement;

        // destroying will remove the mount point as well
        assert(dv1node === null);
    });

    it('simple section - async data', done => {
        const dv2id = 'dv2';
        const dv2template1 = `
            <dv-section dv-data="dv2data1" id="${dv2id}">
                {{ message }}
            </dv-section>
        `;
        const dv2data1 = new Promise(resolve =>
            resolve({ message: 'hello there; i"m async' }));

        // inject html into the page and data into the global scope
        injectFixtures(dv2template1, { dv2data1 });

        // since the page has already loaded, trigger the page parse manually
        parsePage();

        dv2data1.then((data: { message: string }) => {
            const dvsection = api.sections[dv2id];

            const dv2node: HTMLElement = document.getElementById(dv2id) as HTMLElement;

            assert(dvsection.id === dv2id);
            assert(dv2node.getAttribute('id') === dv2id);
            assert(dv2node.innerHTML.trim() === data.message);

            dvsection.destroy();

            done();
        });
    });

    it('simple section - sync chart data', () => {
        const dv3id = 'dv3';
        const dv3idchart = 'dv3chart';
        const dv3template1 = `
            <dv-section id="${dv3id}">
                <dv-chart id="${dv3idchart}" dv-config="dv3config"></dv-chart>
            </dv-section>
        `;
        const dv3config = {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Fruit Consumption'
            },
            xAxis: {
                categories: ['Apples', 'Bananas', 'Oranges']
            },
            yAxis: {
                title: {
                    text: 'Fruit eaten'
                }
            },
            series: [{
                name: 'Jane',
                data: [1, 0, 4]
            }, {
                name: 'John',
                data: [5, 7, 3]
            }]
        };

        // inject html into the page and data into the global scope
        injectFixtures(dv3template1, { dv3config });

        // since the page has already loaded, trigger the page parse manually
        parsePage();

        const dvsection = api.sections[dv3id];
        const dv3chartnode: HTMLElement = document.getElementById(dv3idchart) as HTMLElement;

        assert(dvsection.id === dv3id);
        assert(dv3chartnode.getAttribute('id') === dv3idchart);
        assert(dv3chartnode.hasAttribute('data-highcharts-chart'));

        // both DQChart and Highchart object should be defined
        assert(!!dvsection.charts[dv3idchart]);
        assert(!!dvsection.charts[dv3idchart].highchart);

        dvsection.destroy();
    });
});