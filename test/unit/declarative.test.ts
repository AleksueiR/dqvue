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
                {{ message }}
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

        const dv1node: HTMLElement = document.getElementById(dv1id)  as HTMLElement;

        assert(dvsection.id === dv1id);
        assert(dv1node.getAttribute('id') === dv1id);
        assert(dv1node.innerHTML.trim() === dv1data1.message);
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

            done();
        });
    });

});