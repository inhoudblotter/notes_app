/* eslint-disable node/no-unpublished-require */

const svelte = require("rollup-plugin-svelte");
const { default: resolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const { babel } = require("@rollup/plugin-babel");
const livereload = require("rollup-plugin-livereload");
const { terser } = require("rollup-plugin-terser");
const css = require("rollup-plugin-css-only");
const path = require('path');
const production = !process.env.ROLLUP_WATCH;

module.exports = {
  input: path.join(__dirname, "frontend-src/main.js"),
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: path.join(__dirname, "public/bundle.js"),
  },
  plugins: [
    svelte({
      compilerOptions: {
        dev: !production,
      },
    }),

    css({ output: path.join(__dirname, "bundle.css" )}),

    babel({
      extensions: [".js", ".mjs", ".svelte"],
      babelHelpers: "runtime",
      include: ["src/**", "node_modules/svelte/**"],
    }),

    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),

    commonjs(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
