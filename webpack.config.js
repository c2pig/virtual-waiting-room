'use strict';

const nodeExternals = require('webpack-node-externals');

module.exports = {
 entry: './src/index.ts',
  output: {
    filename: 'index.js', 
    libraryTarget: 'this'
  },
  target: 'node', // <-- Important
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true
        }
      }
    ]
  },
  resolve: {
      extensions: [ '.ts', '.js' ]
  },
  externals: [nodeExternals()]
};
