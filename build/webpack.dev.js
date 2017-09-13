// const utils = require('./utils');
const webpack = require('webpack');
const config = require('../config');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

const commonWebpackConfig = require('./webpack.common');

// add hot-reload related code to entry chunks
Object.keys(commonWebpackConfig.entry).forEach(function (name) {
    commonWebpackConfig.entry[name] = ['./build/dev-client'].concat(commonWebpackConfig.entry[name])
});

module.exports = merge(commonWebpackConfig, {
    /*module: {
        rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
    },*/
    // cheap-module-eval-source-map is faster for development
    devtool: '#cheap-module-eval-source-map',
    plugins: [

        new webpack.DefinePlugin({
            'process.env': config.dev.env
        }),
        // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            inject: true
        }),
        new FriendlyErrorsPlugin()
    ]
})