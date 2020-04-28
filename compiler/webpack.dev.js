const webpack = require('webpack');
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, '../src/index.ts'),
  output: {
    filename:'js/bundle.js',
    path: path.resolve(__dirname, "../dist/assets/" )
  },
  devtool: "source-map",
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '>': path.resolve(__dirname, 'src'),
      'PIXI': path.resolve(__dirname, '../src/lib/pixi.1.6.1')
    }
  },
  devServer: {
    contentBase: path.join(__dirname, '../dist'), // boolean | string | array, static file location
    port: 9000,
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    https: false, // true for self-signed, object for cert authority
    noInfo: true, // only errors & warns on hot reload
    host: '0.0.0.0'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "source-map-loader", 
        enforce: "pre"
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: ['style-loader','css-loader','less-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Tile Viewer',
      template: path.resolve(__dirname, '../src/index.html')
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
}
