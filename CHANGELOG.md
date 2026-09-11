# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.1 — Do not re-ingest the output destination

### Fixed: previously generated artifacts are no longer used as source shapes

* On repeated runs with a recursive input glob, the CLI used to pick up its
  own previously generated sprites and stylesheets from the configured
  destination directory and process them as source shapes, producing shapes
  with identifiers derived from the output path (e.g. `assets--OUT--stack--
  svg--sprite`). The destination tree (and the mode-specific output
  directories when the destination is the current directory) is now filtered
  out of the glob results.

## 2.0.0 — Scoped package names

### Breaking: Scoped package name

* The package is now published as **`@svgforge/svgforge-cli`** on both
  [npmjs](https://www.npmjs.com/package/@svgforge/svgforge-cli) and
  [GitHub Packages](https://github.com/svgforge/svgforge-cli/pkgs/npm/svgforge-cli)
  (GitHub's package registry requires scoped package names). Install with
  `npm install --global @svgforge/svgforge-cli`.
* **Upgrade path from 1.x:** the unscoped `svgforge-cli` package is deprecated
  and no longer receives updates. Existing installs must reinstall
  `@svgforge/svgforge-cli@^2.0.0` and use the `svgforge` command, which now
  depends on the scoped `@svgforge/svgforge` library.
* Depend on `@svgforge/svgforge` (scoped) instead of `svgforge`.

### Changed: Examples use the modern «symbol» mode

* The command-line examples (README, `docs/command-line.md`) now demonstrate
  the «symbol» mode instead of the legacy «defs» mode. The «defs» mode itself
  stays supported.

## 1.1.0 — View `.dims` stylesheet and svgforge 1.1.0

### Removed: `lodash.merge` dependency

* Replace `lodash.merge` with the `deepMerge` helper already used by the
  svgforge library (`svgforge/lib/svg-sprite/utils/index.js`), removing
  the last lodash dependency

### Changed: depend on svgforge 1.1.0 and fix the GitHub release step

* Bump the `svgforge` dependency to `^1.1.0` (view-mode `.dims` stylesheet,
  example-document overhaul and invalid-XML fix)
* Add `GH_TOKEN` to the release workflow so `gh release create` can publish
  the GitHub release (it previously failed for svgforge with
  "select a GitHub user or use GH_TOKEN")

### Changed: re-add the `view` mode dimension stylesheet

* Re-introduce the `--view-render-css` flag (and `--view-render-css-template` /
  `--view-render-css-dest`) so the `view` mode can render the plain `.dims`
  size stylesheet (width/height only) — matching the `defs`/`symbol`/`stack`
  modes. Consumers size an icon by `class="<icon>-dims"` without knowing its
  dimensions.
* Fix a bug that made the CLI build **all** four modes on every run: yargs
  populates every mode flag with `default: false`, so `Object.hasOwn(argv, mode)`
  was true for all modes. Mode activation now checks the flag truthiness instead,
  so only the explicitly requested modes are built.

### Documentation

* Link the svgforge configuration documentation and point to the DeepWiki
  page instead of the online configurator
* Mark the `defs` sprite mode as legacy in the modes table

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

## 1.0.0-alpha — 2026-09

* Standalone command line interface for svgforge
* Support for all sprite modes (css, view, defs, symbol, stack) and render
  types (css, scss, html)
* Yargs-based option parsing with dot-separated configuration mapping
* External JSON config files (`--config`) and shape transform configuration
* Glob-based file selection and directory traversal into shape IDs