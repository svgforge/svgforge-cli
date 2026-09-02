# svgforge-cli

[[Command line interface](https://github.com/joeda1/svgforge-cli) for [svgforge](https://github.com/svgforge/svgforge) — create optimized **SVG sprites** of several types along with accompanying stylesheet resources (CSS, Sass, LESS, Stylus, etc.).

## Installation

Install globally to use `svgforge` anywhere:

```bash
npm install --global @joeda1/svgforge-cli
```

Or as a project dependency (e.g. for usage in npm scripts):

```bash
npm install --save-dev @joeda1/svgforge-cli
```

## Usage

```
svgforge [options] files
```

Run `svgforge --help` to get a full list of all available options, or consult the [command line reference](docs/command-line.md).

### Examples

Create a CSS sprite of all SVG files in `assets/` and write the result — along with an example HTML document — to the `out/` directory:

```bash
svgforge --css --css-render-css --css-example --css-bust=false --dest=out assets/*.svg
```

The same using the shorter argument syntax:

```bash
svgforge -cD out --ccss --cx assets/*.svg
```

Render a Sass stylesheet instead of plain CSS and add a 10px padding around all shapes:

```bash
svgforge -cD out --cscss -p 10 assets/*.svg
```

Instead of passing options on the command line you can also use an external JSON config file:

```bash
svgforge --config config.json assets/*.svg
```

> **Tip:** A config file can be generated with the [online configurator](https://svgforge.github.io/svgforge/#json).

### Sprite modes

The CLI supports all five sprite modes of svgforge. Activate them individually or combine them in a single run (e.g. `--css --symbol`):

| Mode | Flag | Description |
| ---- | ---- | ----------- |
| `css` | `--css` / `-c` | Traditional CSS sprite with a stylesheet |
| `view` | `--view` / `-v` | SVG view-based sprite |
| `defs` | `--defs` / `-d` | Sprite of `<defs>` elements |
| `symbol` | `--symbol` / `-s` | Sprite of `<symbol>` elements for inline embedding |
| `stack` | `--stack` / `-S` | Stacked sprite with `:target` CSS |

### Advanced globbing

Some shells don't support the double-star character `**`. Wrap your glob expression in single quotes so that Node.js handles the matching instead:

```bash
svgforge --config config.json 'assets/**/*.svg'
```

The CLI typically derives shape IDs from the file basename. To start ID traversal from a base directory, add a symbolic link to that directory (`./`) to your pattern:

```bash
svgforge --config config.json 'assets/./**/*.svg'
```

This results in shape IDs like `path--to--source` (assuming the default shape ID generator is used).

## Development

Requirements: Node.js >= 18, [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm lint     # Run XO linter
pnpm test     # Run the test suite (node --test)
```

The test suite spawns the CLI as a child process against fixtures in `test/fixtures/` and asserts the generated sprite files and their contents.

## Related

- [svgforge](https://github.com/svgforge/svgforge) — the underlying sprite creation library
- [svgforge docs](https://github.com/svgforge/svgforge/tree/main/docs) — detailed documentation of all sprite modes

## License

[MIT](LICENSE) © Felix Müller