"use strict";

const path = require("path");
const { BannerPlugin } = require('webpack');
const pjson = require('../package.json');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const {InjectManifest} = require('workbox-webpack-plugin');

const port = process.env.PORT || 8888;

module.exports = {
  mode: 'production',
  devtool: 'source-map',

  entry: {
    "maplat": path.resolve(__dirname, "../tmpl/web-bridge.js"),
  },

  plugins: [
    new BannerPlugin({
      banner: `${pjson.name} v${pjson.version} | ${pjson.author} | license: ${pjson.license}`
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      scriptLoading: "blocking"
    }),
    new MiniCssExtractPlugin({
      filename: "./assets/[name].css"
    }),
    new InjectManifest({
      swDest: "./service-worker.js",
      swSrc: './src/service-worker.js'
    })

  ],

  externals: [
    { mapboxgl: "mapboxgl" }
  ],

  resolve: {
    extensions: [".js"],
  },

  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /(legacy|node_modules)/,
        loader: "eslint-loader",
        options: {
          cache: true
        }
      },
      {
        test: /\.js$/,
        //exclude: /node_modules(?![/\\](@maplat|swiper|dom7|weiwudi)[/\\])/,
        exclude: /node_modules/,
        use: [
          { loader: "strip-whitespace-loader" },
          { loader: 'babel-loader' }
        ]
      },
      {
        test: /\.less$/,
        exclude: /node_modules(?![/\\]@maplat[/\\])/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader" },
          { loader: "less-loader" }
        ]
      }
    ]
  },

  target: "web",

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },

  devServer: {
    host: "localhost",
    port,
    open: ["index.html"],
    allowedHosts: "all",
    static: {
      directory: path.resolve(__dirname, '../'),
      watch: true,
    },
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    },
    onBeforeSetupMiddleware(_app, _server, _compiler) {
      console.log(`Server running at http://localhost:${port}`);
    }
  }
};
