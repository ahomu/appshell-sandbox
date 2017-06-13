const path = require('path');
const { DefinePlugin, LoaderOptionsPlugin } = require('webpack');
const { CommonsChunkPlugin, ModuleConcatenationPlugin, UglifyJsPlugin } = require('webpack').optimize;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanObsoleteChunksPlugin = require('webpack-clean-obsolete-chunks');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxBuildWebpackPlugin = require('workbox-webpack-plugin');
const fragmentsConfig = require('./src/config/fragments.js');

const SRC_ROOT = 'src';
const SRC_VIEWS = 'src/views';
const SRC_STATIC = 'src/static';
const SRC_FRAGMENTS = `src/fragments`;

const DIST_ROOT = 'dist';
const DIST_VIEWS = 'dist/views';
const DIST_PUBLIC = 'dist/public';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// const entryPoints = fragmentsConfig.reduce((ret, {name}) => {
//   ret[name] = path.join(__dirname, SRC_FRAGMENTS, name, 'index.js');
//   return ret;
// }, {});

console.log('process.env.NODE_ENV', process.env.NODE_ENV);

module.exports = {
  entry: Object.assign({
    bootstrap: path.join(__dirname, SRC_ROOT, 'bootstrap.js'),
  }/*, entryPoints*/),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  plugins: [
    new CleanObsoleteChunksPlugin(), // for during watch compilation

    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'local')
      }
    }),

    new HtmlWebpackPlugin({
      inject: false,
      path: path,
      template: path.join(SRC_VIEWS, 'index.hbs'),
      filename: path.join(path.resolve(__dirname, DIST_VIEWS), 'index.hbs'),
    }),

    new CopyWebpackPlugin([
      { from: SRC_STATIC },
      { from: './node_modules/workbox-sw/build/importScripts/workbox-sw.prod.v1.0.1.js', to: 'workbox-sw.v1.0.1.js' },
      { from: './node_modules/babel-polyfill/dist/polyfill.min.js', to: 'polyfill.js' },
    ]),

    new WorkboxBuildWebpackPlugin({
      globDirectory: DIST_PUBLIC,
      globPatterns: ['*.{html,js,css}', 'images/**/*.{jpg,jpeg,png,gif,webp,svg}'],
      globIgnores: ['sw.js'],
      swSrc: path.join(SRC_ROOT, 'sw.js'),
      swDest: path.join(DIST_PUBLIC, 'sw.js'),
      templatedUrls: {
        '/app-shell': ['../views/index.hbs'],
      },
    }),

    // TODO Automatically extract common modules from each fragment, after resolved that webpack issue #4392.
    // #4392 Using webpackChunkName with dynamic import changes chunk logic
    // https://www.bountysource.com/issues/44759262-using-webpackchunkname-with-dynamic-import-changes-chunk-logic
    new CommonsChunkPlugin({
      name: 'vendors',
      chunks: 'bootstrap',
      minChunks: function (module) {
        return module.context && module.context.indexOf("node_modules") !== -1;
      }
    }),

    new ModuleConcatenationPlugin(),

    new UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),

    new LoaderOptionsPlugin({
      minimize: IS_PRODUCTION
    })
  ],
  devtool: IS_PRODUCTION ? '#hidden-source-map' : '#eval-cheap-source-map',
  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: "[name].[chunkhash].js",
    sourceMapFilename: `[name].[chunkhash].js.map`,
    path: path.resolve(__dirname, DIST_PUBLIC),
  },
};
