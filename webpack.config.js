const path = require('path');

module.exports = {
  module: {
    rules:
      [{
        test: /\.([cm]?js|jsx)$/,
        exclude: /node_modules/,
        include: [
          path.resolve('/node_modules/p-defer/'),
          path.resolve('/node_modules/abort-controller/'),
          path.resolve('/node_modules/markdown-it-attrs/'),
          path.resolve('/node_modules/web-speech-cognitive-services/node_modules/p-defer/'),
          path.resolve('/node_modules/microsoft-cognitiveservices-speech-sdk/node_modules/@angular')
        ],
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }, {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  output: {
    filename: '[name].js',
    library: 'ChatAdapter',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist')
  }
};
