import * as Highcharts from 'highcharts';

import * as loglevel from 'loglevel';

import { DVSection } from './../classes/section';
import { DVChart } from './../classes/chart';
import { sections, charts } from './../store/main';

const version = require('./../../package.json').version;
const log: loglevel.Logger = loglevel.getLogger('DQV');

enum HCEnvironment {
    FULL = 'full',
    MINIMAL = 'minimal',
    NONE = 'none'
}

interface EnhancedWindow extends Window {
    Highcharts: typeof Highcharts;
}

let hc: typeof Highcharts;
let hcModules: { [name: string]: (hc: typeof Highcharts) => void } = {};
let hcEnvironment: HCEnvironment = process.env.HC_ENV as HCEnvironment;

log.info(`[DQV] Highchart environment is "${hcEnvironment}"`);

// http://ideasintosoftware.com/typescript-conditional-imports/
// conditionally import highcharts if the HC env variable is not set to 'none'
function importHighcharts(): void {
    if ((<EnhancedWindow>window).Highcharts) {
        hc = (<EnhancedWindow>window).Highcharts;
        hcEnvironment = HCEnvironment.NONE;

        log.info(`[DQV] using globally defined Highcharts (${(<any>hc).version})`);
        log.info(`[DQV] Highchart environment is "${hcEnvironment}"`);
    } else if (process.env.HC_ENV !== 'none') {
        // 'none' value must be hardcoded, otherwise conditional loading doesn't work; HCEnvironment.NONE

        hc = require('highcharts');
        log.info(`[DQV] using internal Highcharts (${(<any>hc).version})`);

        if (process.env.HC_ENV === 'full') {
            // 'full' value must be hardcoded, otherwise conditional loading doesn't work; HCEnvironment.FULL

            hcModules = {
                accessibility: require('./../../node_modules/highcharts/modules/accessibility.src.js'),
                annotations: require('./../../node_modules/highcharts/modules/annotations.src.js'),
                boost: require('./../../node_modules/highcharts/modules/boost.src.js'),
                'boost-canvas': require('./../../node_modules/highcharts/modules/boost-canvas.src.js'),
                'broken-axis': require('./../../node_modules/highcharts/modules/broken-axis.src.js'),
                bullet: require('./../../node_modules/highcharts/modules/bullet.src.js'),
                // canvas tools cannot be wrapped by webpack since it looks for globally defined Highcharts
                // 'canvas-tools': require('./../../node_modules/highcharts/modules/canvas-tools.src.js'),
                data: require('./../../node_modules/highcharts/modules/data.src.js'),
                'drag-panes': require('./../../node_modules/highcharts/modules/drag-panes.src.js'),
                drilldown: require('./../../node_modules/highcharts/modules/drilldown.src.js'),
                exporting: require('./../../node_modules/highcharts/modules/exporting.src.js'),
                'export-data': require('./../../node_modules/highcharts/modules/export-data.src.js'),
                // using `funnel` and `gantt` together causes a console error and messes up x-axis labels
                funnel: require('./../../node_modules/highcharts/modules/funnel.src.js'),
                gantt: require('./../../node_modules/highcharts/modules/gantt.src.js'),
                'grid-axis.sr': require('./../../node_modules/highcharts/modules/grid-axis.src.js'),
                heatmap: require('./../../node_modules/highcharts/modules/heatmap.src.js'),
                'histogram-bellcurve': require('./../../node_modules/highcharts/modules/histogram-bellcurve.src.js'),
                'item-series': require('./../../node_modules/highcharts/modules/item-series.src.js'),
                map: require('./../../node_modules/highcharts/modules/map.src.js'),
                'no-data-to-display': require('./../../node_modules/highcharts/modules/no-data-to-display.src.js'),
                'offline-exporting': require('./../../node_modules/highcharts/modules/offline-exporting.src.js'),
                oldie: require('./../../node_modules/highcharts/modules/oldie.src.js'),
                'overlapping-datalabels': require('./../../node_modules/highcharts/modules/overlapping-datalabels.src.js'),
                'parallel-coordinates': require('./../../node_modules/highcharts/modules/parallel-coordinates.src.js'),
                pareto: require('./../../node_modules/highcharts/modules/pareto.src.js'),
                sankey: require('./../../node_modules/highcharts/modules/sankey.src.js'),
                'series-label': require('./../../node_modules/highcharts/modules/series-label.src.js'),
                'solid-gauge': require('./../../node_modules/highcharts/modules/solid-gauge.src.js'),
                'static-scale': require('./../../node_modules/highcharts/modules/static-scale.src.js'),
                stock: require('./../../node_modules/highcharts/modules/stock.src.js'),
                streamgraph: require('./../../node_modules/highcharts/modules/streamgraph.src.js'),
                sunburst: require('./../../node_modules/highcharts/modules/sunburst.src.js'),
                tilemap: require('./../../node_modules/highcharts/modules/tilemap.src.js'),
                treemap: require('./../../node_modules/highcharts/modules/treemap.src.js'),
                'variable-pie': require('./../../node_modules/highcharts/modules/variable-pie.src.js'),
                variwide: require('./../../node_modules/highcharts/modules/variwide.src.js'),
                vector: require('./../../node_modules/highcharts/modules/vector.src.js'),
                windbarb: require('./../../node_modules/highcharts/modules/windbarb.src.js'),
                wordcloud: require('./../../node_modules/highcharts/modules/wordcloud.src.js'),
                xrange: require('./../../node_modules/highcharts/modules/xrange.src.js'),
                'xrange-series': require('./../../node_modules/highcharts/modules/xrange-series.src.js')
            };

            // TODO: decide if modules should be dynamically loaded by DQV
            log.info(`[DQV] locally available Highcharts modules:`, hcModules);
        }
    } else {
        log.error(`[DQV] Highcharts is not defined`);
        throw new Error(`[DQV] Highcharts is not defined`);
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

    set highchartsModules(names: string[]) {
        // TODO: handle loading the same module twice
        if (!this.Highcharts) {
            return;
        }

        if (hcEnvironment === HCEnvironment.NONE) {
            log.warn(
                `[DQV] Higcharts is supplied by the host page; any modules should be loaded there as well`
            );
            return;
        }

        names.forEach(name => {
            if (!hcModules[name]) {
                return;
            }

            log.info(`[DQV] loading "${name}" Highcharts module`);
            hcModules[name](this.Highcharts);
        });
    },

    loglevel,
    version,

    Section: DVSection,
    Chart: DVChart,

    get sections(): { [name: string]: DVSection } {
        // TODO: return a clone instead of original object so users can't mess with it
        return sections;
    },

    get charts(): { [name: string]: DVChart } {
        return charts;
    }
};
