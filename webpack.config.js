var path = require('path');

var webpack = require('webpack');
var candelaLoaders = require('candela/webpack');
var HtmlPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = candelaLoaders({
  devtool: 'cheap-module-eval-source-map',
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
      title: 'ModSquad',
      chunks: [
        'index'
      ]
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new CopyWebpackPlugin([
      { from: 'src/tangelo/config.py', to: 'config.py' },
      { from: 'src/tangelo/d3mLm.py', to: 'd3mLm.py' },
      { from: 'src/tangelo/dataset.py', to: 'dataset.py' },
      { from: 'src/tangelo/pipeline.py', to: 'pipeline.py' },
      { from: 'src/tangelo/session.py', to: 'session.py' },
      { from: 'src/tangelo/core_pb2.py', to: 'core_pb2.py' },
      { from: 'src/tangelo/core_pb2_grpc.py', to: 'core_pb2_grpc.py' }
    ])
  ]
});
