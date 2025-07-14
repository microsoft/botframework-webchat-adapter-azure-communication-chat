const path = require('path');

module.exports = {
  entry: {
    'chat-adapter.es5': ['./src/entry.es5.ts', './src/index.ts']
  },
  devtool: false,
  module: {
    rules: [
      {
        include: [
          // Use an object instead of a string
          [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, 'src')],
          {
            not: [path.resolve(__dirname, 'node_modules/core-js')]
          }
        ],
        test: /\.(js|jsx|ts|tsx)$/,
        use: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'jsx']
  },
  output: {
    filename: '[name].js',
    library: 'ChatAdapter',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist')
  }
};
