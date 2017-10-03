const pkg = require("./package.json");

module.exports = {
    html: {
        title: pkg.productName || pkg.name,
        description: pkg.description,
        template: 'src/index.ejs'
    },
    presets: [
        require('poi-preset-typescript')({}),
        require('poi-preset-karma')({
            port: 5001, // default
            files: ['test/unit/*.test.ts'], // default,
        })
    ],
    extendWebpack(config) {
        config.resolve.alias
            .set('vue$', 'vue/dist/vue.esm.js') // vue.esm include template compiler; without it all templates need to be pre-compiled
            .set('highcharts', 'highcharts/highcharts.src.js'); // include non-minified highcharts into the dev build

        config.output
            .set('library', 'DQV')
            .set('libraryExport', 'default'); // exposes the default export directly on the global library variable: https://webpack.js.org/configuration/output/#output-libraryexport
    },
    karma: {
        mime: {
            'text/x-typescript': ['ts']
        }
    }
};