const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

const config = require('../config');
const commonWebpackConfig = require('./webpack.common');

module.exports = merge(commonWebpackConfig, {
    plugins: [
        /*new ClosureCompilerPlugin({
            jsCompiler: true
        })*/
    ],
    output: {
        filename: 'main.js',
        path: config.build.assetsRoot,
        publicPath: config.build.assetsPublicPath
    }
});