# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.1 — Drop remaining lodash/async dependencies

* Bump the `svgforge` dependency to `^1.0.1` (native promise-based helpers,
  `deepMerge` and `escapeHtml` utilities, no `async`/`lodash` dependencies)

## 1.0.0 - First release

### Removed: «css» sprite mode and view stylesheet rendering

* Drop the `css` sprite mode entirely (`--css`, `--ccss`, `--cscss`,
  `--css-*` flags, the `css` entry in the mode table and the command-line
  reference examples)
* Remove the `view` stylesheet rendering (`--view-render-css`, `--view-render-scss`
  and their template/destination options); the `view` mode now emits only the
  SVG sprite with `<view>` fragment elements and an optional HTML example.
  For background-image sprite usage use the `stack` mode instead
* Keep the plain (non-`background-position`) CSS/SCSS rendering of the
  `defs`, `symbol` and `stack` modes

### Refactor: ES6 classes, JSDoc and xo-default linting

* Convert the CLI to modern ES6 with JSDoc type annotations
* Strip all `off` rules from `xo.config.js`; fixed lint findings in code with
  justified line/file-level disables (`xo .` → 0 errors, 0 warnings)
* Add `u` flags to all regex literals (`require-unicode-regexp`)
* Rename the binary and package from `svg-sprite-cli`/`svg-sprite` to
  `svgforge-cli`/`svgforge`, including all user-facing config descriptions
* Bump engines to Node >= 22 and modernize package metadata
* Resolve the local `svgforge` workspace dependency via a gitignored
  `pnpm-workspace.yaml` override (`svgforge: link:../svgforge`) so the
  committed `package.json` stays publication-safe (`svgforge: 1.0.0`)
* Add `/pnpm-workspace.yaml` to `.gitignore` and regenerate the lockfile
* Replace the `glob` package with the native `fs.globSync` API and drop `glob`
  from the dependencies; `engines.node` stays `>= 22` (required for the glob
  API introduced in Node 22)

## 1.0.0-alpha — 2024-?

* Standalone command line interface for svgforge
* Support for all sprite modes (css, view, defs, symbol, stack) and render
  types (css, scss, html)
* Yargs-based option parsing with dot-separated configuration mapping
* External JSON config files (`--config`) and shape transform configuration
* Glob-based file selection and directory traversal into shape IDs