const pkg = require('./package.json');
const argv = require('yargs').argv;
const webpack = require('webpack');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const minimize = argv.minimize === true;

module.exports = {
    vendor: false,
    extractCSS: false,
    filename: {
        js: `dqvue${minimize ? '.min' : ''}.js`
    },
    html: {
        title: pkg.productName || pkg.name,
        description: pkg.description,
        template: 'src/index.ejs'
    },
    homepage: './',
    minimize: minimize,
    presets: [
        require('poi-preset-babel-minify')({}, { comments: false }),
        require('poi-preset-typescript')({}),
        require('poi-preset-karma')({
            // browsers: ['IE'], // default is ['Chrome']
            port: 5001, // default
            files: ['test/unit/*.test.ts'] // default,
        })
    ],
    extendWebpack(config) {
        config.resolve.alias.set('vue$', 'vue/dist/vue.esm.js'); // vue.esm include template compiler; without it all templates need to be pre-compiled

        config.output.set('library', 'DQV').set('libraryExport', 'default'); // exposes the default export directly on the global library variable: https://webpack.js.org/configuration/output/#output-libraryexport

        // enable to see the bundle structure
        // config.plugin('bundleAnalyzer').use(BundleAnalyzerPlugin);
    },
    karma: {
        mime: {
            'text/x-typescript': ['ts']
        },
        karmaTypescriptConfig: undefined
    }
};
