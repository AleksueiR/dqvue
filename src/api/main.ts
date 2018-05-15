import Highcharts from 'highcharts';

import loglevel from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';

import {
    sectionCreated,
    chartCreated,
    sectionDestroyed,
    chartDestroyed
} from './../observable-bus';

import { Observable } from 'rxjs/Observable';

const version = require('./../../package.json').version;
const log: loglevel.Logger = loglevel.getLogger('DQV');

const langObjects = {
    en: {
        lang: {
            loading: 'Loading...',
            months: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ],
            shortMonths: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ],
            weekdays: [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ],
            decimalPoint: '.',
            numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],
            resetZoom: 'Reset zoom',
            resetZoomTitle: 'Reset zoom level 1:1',
            thousandsSep: ' ',
            printChart: 'Print chart',
            downloadPNG: 'Download PNG image',
            downloadJPEG: 'Download JPEG image',
            downloadPDF: 'Download PDF document',
            downloadSVG: 'Download SVG vector image',
            contextButtonTitle: 'Chart context menu',
            downloadCSV: 'Download CSV',
            downloadXLS: 'Download XLS',
            viewData: 'View data table'
        }
    },
    fr: {
        lang: {
            contextButtonTitle: 'Menu contextuel du graphique',
            decimalPoint: ',',
            downloadCSV: 'Télécharger en CSV',
            downloadJPEG: 'Télécharger en JPEG',
            downloadPDF: 'Télécharger en PDF',
            downloadPNG: 'Télécharger en PNG',
            downloadSVG: 'Télécharger en SVG',
            downloadXLS: 'Télécharger en XLS',
            exportButtonTitle: 'Exporter',
            loading: 'Chargement...',
            months: [
                'Janvier',
                'Février',
                'Mars',
                'Avril',
                'Mai',
                'Juin',
                'Juillet',
                'Août',
                'Septembre',
                'Octobre',
                'Novembre',
                'Décembre'
            ],
            numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],
            printChart: 'Imprimer',
            rangeSelectorFrom: 'Du',
            rangeSelectorTo: 'au',
            rangeSelectorZoom: 'Période',
            resetZoom: 'Réinitialiser le zoom',
            resetZoomTitle: 'Réinitialiser le zoom',
            shortMonths: [
                'Jan',
                'Fév',
                'Mar',
                'Avr',
                'Mai',
                'Juin',
                'Juil',
                'Aoû',
                'Sep',
                'Oct',
                'Nov',
                'Déc'
            ],
            thousandsSep: ' ',
            viewData: 'Voir les données',
            weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        }
    }
};
interface EnhancedWindow extends Window {
    Highcharts: typeof Highcharts;
}

let hc: typeof Highcharts;
let lang: string = 'en';

function importHighcharts(): void {
    if ((<EnhancedWindow>window).Highcharts) {
        hc = (<EnhancedWindow>window).Highcharts;

        log.info(`[DQV] using globally defined Highcharts (${(<any>hc).version})`);
    } else {
        log.error(`[DQV] Highcharts is not defined; please load Highcharts first`);
        throw new Error(`[DQV] Highcharts is not defined`);
    }
}

// semi-public functionality not exposed on the HC declarations
export namespace DVHighcharts {
    export interface Options extends Highcharts.Options {
        exporting: ExportingOptions;
    }

    export interface ExportingOptions extends Highcharts.ExportingOptions {
        // `menuItemDefinitions` is not included in the `ExportingOptions` type
        menuItemDefinitions: { [name: string]: MenuItem | null };
    }

    export interface ChartObject extends Highcharts.ChartObject {
        // https://api.highcharts.com/highcharts/chart.resetZoomButton
        resetZoomButton: Highcharts.ElementObject | undefined;
        showResetZoom: () => void;

        // `getTable` is not included in default Highcharts types
        getTable?: () => string;
    }

    export interface ChartOptions extends Highcharts.ChartOptions {
        zoomSlider?: noUiSlider.Options;
    }

    export interface AxisObject extends Highcharts.AxisObject {
        // https://api.highcharts.com/highcharts/xAxis.minRange
        minRange: number;
    }

    export interface AxisEvent extends Highcharts.AxisEvent {}

    // https://api.highcharts.com/highcharts/exporting.menuItemDefinitions
    export interface MenuItem extends Highcharts.MenuItem {
        text: string;
        onclick: (highchartObject?: Highcharts.ChartObject) => void;
    }
}

export default {
    get Highcharts(): typeof Highcharts {
        if (hc) {
            return hc;
        }

        importHighcharts();
        return hc;
    },

    loglevel,
    version,

    Section: DVSection,
    Chart: DVChart,

    sectionCreated: sectionCreated.asObservable(),
    chartCreated: chartCreated.asObservable(),
    sectionDestroyed: sectionDestroyed.asObservable(),
    chartDestroyed: chartDestroyed.asObservable(),

    get sections(): { [name: string]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [name: string]: DVChart } {
        return charts;
    },

    set language(newLang: string) {
        if (newLang !== 'en' && newLang !== 'fr') {
            console.error(
                "DQV does not support that language. We support 'en' (English/Anglais) and 'fr' (French/Francais)"
            );
            return;
        }
        lang = newLang;
        hc.setOptions((<any>langObjects)[lang]);
    },

    get language(): string {
        return lang;
    }
};
