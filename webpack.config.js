//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'none', // production mode for optimization

  entry: './src/extension.ts', // the entry point of this extension
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2' // compatible with Node.js require
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is excluded from the bundle
  },
  resolve: {
    extensions: ['.ts', '.js'] // resolve TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader' // use ts-loader for transpiling TypeScript
      },
      {
        test: /\.css$/, // handle CSS files
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.html$/, // handle HTML files
        use: 'html-loader'
      }
    ]
  },
  devtool: 'nosources-source-map', // source maps without original source code
  infrastructureLogging: {
    level: 'log', // enables logging for problem matchers
  },
};

module.exports = [extensionConfig];
