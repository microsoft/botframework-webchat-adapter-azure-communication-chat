const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  entry: {
    'chat-adapter-debug': './src/index.ts'
  },
  mode: 'development',
  devtool: 'inline-source-map'
});
