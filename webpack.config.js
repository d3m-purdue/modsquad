var path = require('path');

var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js'
  },
  output: {
    path: path.resolve('build'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015']
            }
          }
        ]
      },
      {
        test: /\.jade$/,
        use: 'jade-loader'
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(eot|woff2|woff|ttf|svg)$/,
        use: 'url-loader',
        include: /node_modules\/bootstrap/
      },
      {
        test: /\.csv$/,
        use: 'raw-loader',
        exclude: /node_modules/
      },
      {
        test: /\.yml$/,
        exclude: /node_modules/,
        use: [
          'json-loader',
          'yaml-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlPlugin({
      template: './src/index.template.ejs',
      title: 'Reduxstrap!',
      chunks: [
        'index'
      ]
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
