const CopyWebpackPlugin = require("copy-webpack-plugin");
const { IgnorePlugin } = require("webpack");
const path = require("path");

module.exports = {
  entry: "./index.ts",
  target: "electron-main",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./")
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        require.resolve("electron-chrome-extensions/preload"),
        require.resolve("electron-chrome-web-store/preload")
      ]
    })
  ],
  externals: ["sharp", "knex", "better-sqlite3"]
};
