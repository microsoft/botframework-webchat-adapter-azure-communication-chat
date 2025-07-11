const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const path = require('path');

module.exports = merge(common, {
  entry: {
    'chat-adapter-dev': './src/development/index.ts'
  },
  module: {
    rules: [
      {
        test: /(threadInitialize\.ts)|(fileManagerInitialize\.ts)$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'RESOURCE_CONNECTION_STRING_TO_BE_REPLACED',
              replace: process.env['ResourceConnectionString']
            },
            {
              search: 'ONEDRIVE_TOKEN',
              replace: process.env['OneDriveToken']
            }
          ]
        }
      }
    ]
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, './')
    },
    compress: false,
    client: false,
    port: 8080
  },
  mode: 'development',
  devtool: 'inline-source-map'
});
