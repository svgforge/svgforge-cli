# svgforge

This file is part of the documentation of *svgforge* — a free low-level Node.js module that **takes a bunch of SVG files**, optimizes them and creates **SVG sprites** of several types. The package is [hosted on GitHub](https://github.com/svgforge/svgforge).


## Command line usage

You may use *svgforge* as a command line tool. Type `svgforge --help` to get all the available options:

```text
Usage: svgforge [options] files

Options:
  --version                    Show version number  [boolean]
  --help                       Display this help information  [boolean]
  -D, --dest                   Main output directory (base path)  [default: "."]
  -C, --config                 Path to external JSON config file
  -l, --log                    Logging verbosity ("info", "verbose" or "debug")
  --shape-id-separator         Separator for traversing a directory structure into a shape ID  [default: "--"]
  --shape-id-generator         ID generation callback [via CLI only template strings]  [default: "%s"]
  --shape-id-pseudo            Separator for CSS pseudo classes  [default: "~"]
  --shape-id-whitespace        Whitespace replacement string for shape IDs  [default: "_"]
  -w, --shape-dim-width        Maximum shape width in pixels  [default: 2000]
  -h, --shape-dim-height       Maximum shape height in pixels  [default: 2000]
  --shape-dim-precision        Precision (decimal places) for dimension calculations  [default: 2]
  --shape-dim-attributes       Whether to add width and height attributes to the shapes  [boolean] [default: false]
  -p, --shape-spacing-padding  Padding around shape (up to 4 x comma-separated)  [default: "0,0,0,0"]
  -b, --shape-spacing-box      Box sizing strategy ("content", "padding" or "icon")  [default: "content"]
  -m, --shape-meta             Path to YAML file with meta information
  -a, --shape-align            Path to YAML file with alignment information
  --ims, --shape-dest          Path to output directory for intermediate SVG files
  --shape-transform            Comma-separated list of predefined transformers (see docs)  [default: "svgo"]
  --shape-transform-*          External JSON config files for named transformers
  --svg-xmldecl                Whether to include an XML declaration in SVG files  [boolean] [default: true]
  --svg-doctype                Whether to include a doctype declaration in SVG files  [boolean] [default: true]
  --svg-namespace-ids          Whether to apply ID namespacing to the sprite  [boolean] [default: true]
  --svg-namespace-prefix       What, if any, prefix to apply to the automatically generated id  [default: ""]
  --svg-namespace-classnames   Whether to apply CSS class namespacing to the sprite  [boolean] [default: true]
  --svg-dimattrs               Whether to add width and height attributes to the sprite  [boolean] [default: true]
  --svg-rootattrs              Custom root attributes for the outermost <svg> element (external JSON file)
  --svg-precision              Floating point precision for CSS positioning values  [default: -1]

  -v, --view                   Activates the «view» mode  [boolean] [default: false]
  --view-dest                  Mode specific output directory  [default: "view"]
  --vs, --view-sprite          Sprite path and filename (relative to --view-dest)  [default: "svg/sprite.view.svg"]
  --view-bust                  Enable cache busting  [boolean] [default: true]
  --vx, --view-example         Whether to render an example HTML document  [boolean] [default: false]
  --view-example-template      HTML document Mustache template (relative to svgforge basedir)  [default: "tmpl/view/sprite.html"]
  --view-example-dest          HTML document destination (relative to the --view-dest)  [default: "sprite.view.html"]

  -d, --defs                   Activates the «defs» mode  [boolean] [default: false]
  --defs-dest                  Mode specific output directory  [default: "defs"]
  --defs-prefix                CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --defs-dimensions            CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --ds, --defs-sprite          Sprite path and filename (relative to --defs-dest)  [default: "svg/sprite.css.svg"]
  --defs-bust                  Enable cache busting  [boolean] [default: false]
  --dcss, --defs-render-css    Whether to render a CSS stylesheet  [boolean] [default: false]
  --defs-render-css-template   CSS stylesheet Mustache template (relative to svgforge basedir)  [default: "tmpl/common/sprite.css"]
  --defs-render-css-dest       CSS stylesheet destination (relative to the --defs-dest)  [default: "sprite.css"]
  --defs-render-*              Custom output renderings
  --defs-render-*-template     Custom output Mustache template (relative to svgforge basedir)
  --defs-render-*-dest         Custom output destination (relative to the --defs-dest)
  --di, --defs-inline          Create sprite variant suitable for inline embedding  [boolean] [default: false]
  --dx, --defs-example         Whether to render an example HTML document  [boolean] [default: false]
  --defs-example-template      HTML document Mustache template (relative to svgforge basedir)  [default: "tmpl/defs/sprite.html"]
  --defs-example-dest          HTML document destination (relative to the --defs-dest)  [default: "sprite.defs.html"]

  -s, --symbol                 Activates the «symbol» mode  [boolean] [default: false]
  --symbol-dest                Mode specific output directory  [default: "symbol"]
  --symbol-prefix              CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --symbol-dimensions          CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --ss, --symbol-sprite        Sprite path and filename (relative to --symbol-dest)  [default: "svg/sprite.css.svg"]
  --symbol-bust                Enable cache busting  [boolean] [default: false]
  --sc, --symbol-render-css    Whether to render a CSS stylesheet  [boolean] [default: false]
  --symbol-render-css-template  CSS stylesheet Mustache template (relative to svgforge basedir)  [default: "tmpl/common/sprite.css"]
  --symbol-render-css-dest     CSS stylesheet destination (relative to the --symbol-dest)  [default: "sprite.css"]
  --symbol-render-*            Custom output renderings
  --symbol-render-*-template   Custom output Mustache template (relative to svgforge basedir)
  --symbol-render-*-dest       Custom output destination (relative to the --symbol-dest)
  --si, --symbol-inline        Create sprite variant suitable for inline embedding  [boolean] [default: false]
  --sx, --symbol-example       Whether to render an example HTML document  [boolean] [default: false]
  --symbol-example-template    HTML document Mustache template (relative to svgforge basedir)  [default: "tmpl/symbol/sprite.html"]
  --symbol-example-dest        HTML document destination (relative to the --symbol-dest)  [default: "sprite.symbol.html"]

  -S, --stack                  Activates the «stack» mode  [boolean] [default: false]
  --stack-dest                 Mode specific output directory  [default: "stack"]
  --stack-prefix               CSS selector prefix for all shapes (including placeholders)  [default: ".svg-%s"]
  --stack-dimensions           CSS selector suffix for shape dimension rules ("" for inline)  [default: "-dims"]
  --Ss, --stack-sprite         Sprite path and filename (relative to --stack-dest)  [default: "svg/sprite.css.svg"]
  --stack-bust                 Enable cache busting  [boolean] [default: false]
  --stack-rootviewbox          Add viewBox attribute to root svg automatically  [boolean] [default: true]
  --Sc, --stack-render-css     Whether to render a CSS stylesheet  [boolean] [default: false]
  --stack-render-css-template  CSS stylesheet Mustache template (relative to svgforge basedir)  [default: "tmpl/common/sprite.css"]
  --stack-render-css-dest      CSS stylesheet destination (relative to the --stack-dest)  [default: "sprite.css"]
  --stack-render-*             Custom output renderings
  --stack-render-*-template    Custom output Mustache template (relative to svgforge basedir)
  --stack-render-*-dest        Custom output destination (relative to the --stack-dest)
  --Sx, --stack-example        Whether to render an example HTML document  [boolean] [default: false]
  --stack-example-template     HTML document Mustache template (relative to svgforge basedir)  [default: "tmpl/stack/sprite.html"]
  --stack-example-dest         HTML document destination (relative to the --stack-dest)  [default: "sprite.stack.html"]

  --variables                  Path to external JSON file with Mustache variable definitions
```

### Examples

Create a `view` sprite of the SVG files found in the directory `"assets"` and write it — along with an example HTML document — to the subdirectory `"out"`:

```bash
svgforge --view --view-example --dest=out assets/*.svg
```

Create a `defs` sprite with a CSS stylesheet and an example document:

```bash
svgforge --defs --defs-render-css --defs-example --dest=out assets/*.svg
```

The next one creates a `stack` sprite and adds a 10px padding around all shapes:

```bash
svgforge -S -p 10 assets/*.svg
```

Using a config file (config.json in the project base path) instead of command-line options. A config file can be generated [with the online configurator](https://svgforge.github.io/svgforge/#json).

```bash
svgforge --config config.json assets/*.svg
```

### Advanced globbing

Some shells don't support the double-star character `**` for matching files in an arbitrary directory depth, so you should wrap your glob expression in single quotes when using it in your pattern. This will prevent your shell from trying to resolve it and rather delegate globbing to Node instead (which does support the `**` character).

```bash
svgforge --config config.json 'assets/**/*.svg'
```

The CLI typically uses only the basename of files for constructing the shape IDs in your sprite. That is, if an SVG source file is found at the path `assets/path/to/source.svg`, the shape inside the sprite will have the ID `source`. If you want to set a "base directory" from where ID traversal should start, simply add a symbolic link to that very same directory (`"./"`) in your pattern:

```bash
svgforge --config config.json 'assets/./**/*.svg'
```

The spriter will then use `path/to/source` for ID creation, resulting in the shape ID `path--to--source` (assuming you don't override the default shape ID generator function). Please be aware that the described feature won't work if the matched SVG files are symbolic links themselves.
