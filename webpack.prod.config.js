const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  entry: {
    'chat-adapter': './src/index.ts'
  },
  mode: 'production'
});