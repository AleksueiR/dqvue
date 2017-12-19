import Vue from 'vue';
import assert from 'assert';

import { DVSection } from '../../src/classes/section';
// import { parsePage } from './../../src/bootstrap';
import api from './../../src/api/main';

const a = new DVSection({ id: 'dfsd' });

interface EnhancedWindow extends Window {
    DQV: {
        Section: any;
        Chart: any;
        sections: { [name: string]: DVSection };
    };

    dvdata1: object;
}

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

// remove the html fixture from the DOM
afterEach(function () {
    const node = document.getElementById('fixture');
    console.log(node);

    document.body.removeChild(node as HTMLElement);
}); */
describe('ok', () => {
    xit('ok', () => {
        const id = 'dv1';
        const dvtemplate1 = `
            <dv-section dv-data="dvdata1" id="${id}">
                {{ message }}
            </dv-section>
        `;
        const dvdata1 = {
            message: 'hello there'
        };

        // inject html into the page
        document.body.insertAdjacentHTML('afterbegin', dvtemplate1);

        // inject data into global scope
        (<EnhancedWindow>window).dvdata1 = dvdata1;

        // since the page has already loaded, trigger the page parse manually
        //parsePage();

        // get the section by id
        const dvsection = api.sections[id];

        assert(dvsection.id === id);
        assert(document.getElementById(id)!.innerHTML.trim() === dvdata1.message);
    });
});
