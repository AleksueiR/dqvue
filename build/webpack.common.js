const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const path = require('path');
const config = require('../config')

function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

module.exports = {
    entry: {
        app: './src/main.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist'])
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js' // vue.esm include template compiler; without it all templates need to be pre-compiled
        }
    },
    output: {
        filename: 'main.js',
        path: config.build.assetsRoot,
        publicPath: config.build.assetsPublicPath,
        library: 'DQV'
    }
};