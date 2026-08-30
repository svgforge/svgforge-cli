'use strict';

/**
 * Integration tests for the svg-sprite-cli
 *
 * @see https://github.com/joeda1/svg-sprite-cli
 * @author Joschi Kuphal <joschi@kuphal.net> (https://github.com/jkphl)
 * @author Felix Müller
 * @copyright © 2018 Joschi Kuphal
 * @copyright © 2026 Felix Müller
 * @license MIT https://github.com/joeda1/svg-sprite-cli/blob/main/LICENSE
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const { execCli, makeTempDir } = require('./helpers.js');

const fixtureDir = path.join(__dirname, 'fixtures');
const svgFiles = ['one.svg', 'two.svg'].map(file => path.join(fixtureDir, file));

/**
 * Run an assertion callback inside a fresh temporary directory
 *
 * @param {() => Promise<void>} callback Assertion callback receiving the directory
 * @returns {Promise<void>} Promise resolving after the callback finished
 */
async function withTempDir(callback) {
  const dir = makeTempDir();

  try {
    await callback(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Check that a file exists and return its contents
 *
 * @param {string} filePath Absolute path to the file
 * @returns {string} File contents
 */
function readFile(filePath) {
  assert.equal(fs.existsSync(filePath), true, `Missing file: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

describe('svg-sprite-cli', () => {
  describe('basic usage', () => {
    it('prints the version', async() => {
      const { stdout } = await execCli(['--version']);
      assert.match(stdout, /\d+\.\d+\.\d+/);
    });

    it('prints usage information for --help', async() => {
      const { stdout } = await execCli(['--help']);
      assert.match(stdout, /^Usage:/m);
      assert.match(stdout, /--css/);
    });

    it('fails when no files are provided', async() => {
      await assert.rejects(execCli([]));
    });
  });

  describe('sprite generation', () => {
    it('creates a CSS sprite with a stylesheet', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--css',
          '--css-render-css',
          '--css-bust=false',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-one\s*{/);
        assert.match(css, /\.svg-two\s*{/);
        assert.match(css, /url\("svg\/sprite\.css\.svg"\)/);

        const sprite = readFile(path.join(dest, 'css', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /^<\?xml/);
        assert.match(sprite, /<svg/);
        assert.match(sprite, /id="one"/);
        assert.match(sprite, /id="two"/);
      });
    });

    it('renders a stylesheet example document on request', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--css',
          '--css-render-css',
          '--css-example',
          '--css-bust=false',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const example = readFile(path.join(dest, 'css', 'sprite.css.html'));
        assert.match(example, /<html/i);
        assert.match(example, /sprite.css.svg/);
      });
    });

    it('creates a symbol sprite', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<symbol viewBox="0 0 24 24" id="one"/);
        assert.match(sprite, /<symbol viewBox="0 0 24 24" id="two"/);
      });
    });

    it('creates a defs sprite', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'defs', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<defs>/);
        assert.match(sprite, /id="one"/);
        assert.match(sprite, /id="two"/);
      });
    });

    it('creates a stack sprite', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--stack', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'stack', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /:root>svg:target/);
        assert.match(sprite, /id="one"/);
        assert.match(sprite, /id="two"/);
      });
    });

    it('creates a view sprite', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<view id="one" viewBox="0 0 24 24"/);
        assert.match(sprite, /<view id="two"/);
      });
    });

    it('generates multiple sprite modes in one run', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--symbol', '--css-bust=false', `--dest=${dest}`, ...svgFiles]);

        assert.equal(fs.existsSync(path.join(dest, 'css', 'svg', 'sprite.css.svg')), true);
        assert.equal(fs.existsSync(path.join(dest, 'symbol', 'svg', 'sprite.css.svg')), true);
      });
    });
  });

  describe('configuration', () => {
    it('loads an external JSON config file', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--config',
          path.join(fixtureDir, 'config.json'),
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const css = readFile(path.join(dest, 'symbol', 'sprite.css'));
        assert.match(css, /\.svg-one/);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<symbol/);
      });
    });

    it('applies custom SVG root attributes from a JSON file', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--symbol',
          '--svg-rootattrs',
          path.join(fixtureDir, 'svg-rootattrs.json'),
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<svg[^>]*data-testid="sprite-root"/);
      });
    });
  });

  describe('options', () => {
    it('applies shape padding', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--symbol',
          '--shape-spacing-padding=5',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /viewBox="-5 -5 34 34"/);
        assert.match(sprite, /id="one"/);
      });
    });
  });

  describe('logging', () => {
    it('writes log output when --log is set', async() => {
      const { stdout } = await execCli(['--symbol', '--log=info', ...svgFiles]);
      assert.match(stdout, /Created spriter/);
    });
  });

  describe('shape identifier options', () => {
    it('traverses directory structures into shape IDs', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', `--dest=${dest}`, './nested/**/*.svg'], { cwd: fixtureDir });

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="nested--leaf"/);
      });
    });

    it('applies a custom shape ID separator', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-separator=__', `--dest=${dest}`, './nested/**/*.svg'], { cwd: fixtureDir });

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="nested__leaf"/);
        assert.doesNotMatch(sprite, /id="nested--leaf"/);
      });
    });

    it('applies a custom shape ID generator', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-generator=%s-icon', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="one-icon"/);
        assert.match(sprite, /id="two-icon"/);
      });
    });

    it('replaces whitespace in shape IDs', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-whitespace=-', `--dest=${dest}`, path.join(fixtureDir, 'with space.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="with-space"/);
      });
    });

    it('uses a custom CSS pseudo class separator', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', `--dest=${dest}`, path.join(fixtureDir, 'button~hover.svg')]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-button:hover/);
      });
    });
  });

  describe('shape dimension and spacing options', () => {
    it('scales shapes to the maximum dimensions', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--shape-dim-width=12', '--shape-dim-height=12', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-one-dims {\s*width: 12px;\s*height: 12px;/);
        assert.match(css, /\.svg-two-dims {\s*width: 12px;\s*height: 12px;/);
      });
    });

    it('rounds shape dimensions to the given precision', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--shape-dim-precision=1', `--dest=${dest}`, path.join(fixtureDir, 'half.svg')]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /width: 24\.4px;/);
        assert.match(css, /height: 12\.1px;/);
      });
    });

    it('accepts the shape dimension attributes option', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-render-css', '--view-bust=false', '--shape-dim-attributes', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /width="24" height="24"/);
      });
    });

    it('applies spacing box padding', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--shape-spacing-padding=4', '--shape-spacing-box=padding', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'css', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /viewBox="-4 -4 32 32"/);
      });
    });
  });

  describe('shape file options', () => {
    it('adds meta data from a YAML file', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-meta', path.join(fixtureDir, 'meta.yaml'), `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /aria-labelledby=/);
        assert.match(sprite, /<title[^>]*>Alpha<\/title>/);
        assert.match(sprite, /<desc[^>]*>First icon<\/desc>/);
      });
    });

    it('aligns shapes from a YAML file', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-layout=vertical', '--shape-align', path.join(fixtureDir, 'align.yaml'), `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-one {[\s\S]*100% 0 no-repeat/);
      });
    });

    it('writes intermediate SVG files to a custom destination', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-dest=intermediate', `--dest=${dest}`, ...svgFiles]);

        const intermediate = readFile(path.join(dest, 'intermediate', 'one.svg'));
        assert.match(intermediate, /^<\?xml/);
      });
    });

    it('applies a custom SVGO transform configuration', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=svgo', '--shape-transform-svgo', path.join(fixtureDir, 'svgo.config.json'), `--dest=${dest}`, path.join(fixtureDir, 'comment.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<!--KEEP-SPECIAL-->/);
      });
    });
  });

  describe('svg output options', () => {
    it('omits the XML declaration on request', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--svg-xmldecl=false', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.doesNotMatch(sprite, /^<\?xml/);
      });
    });

    it('omits the doctype declaration on request', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-bust=false', `--dest=${dest}`, path.join(fixtureDir, 'doctype.svg')]);

        const sprite = readFile(path.join(dest, 'css', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<!DOCTYPE/);
      });

      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-bust=false', '--svg-doctype=false', `--dest=${dest}`, path.join(fixtureDir, 'doctype.svg')]);

        const sprite = readFile(path.join(dest, 'css', 'svg', 'sprite.css.svg'));
        assert.doesNotMatch(sprite, /<!DOCTYPE/);
      });
    });

    it('disables ID namespacing', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-ids=false', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="arrow"/);
        assert.match(sprite, /href="#arrow"/);
      });
    });

    it('disables CSS class namespacing', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-classnames=false', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /class="ic"/);
      });
    });

    it('applies a namespace ID prefix', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-prefix=p-', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="p-aarrow"/);
        assert.match(sprite, /href="#p-aarrow"/);
      });
    });

    it('omits sprite dimension attributes on request', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-render-css', '--view-bust=false', '--svg-dimattrs=false', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.css.svg'));
        const rootOpen = sprite.slice(0, sprite.indexOf('>'));
        assert.doesNotMatch(rootOpen, /width="/);
        assert.doesNotMatch(rootOpen, /height="/);
      });
    });
  });

  describe('css mode configuration', () => {
    it('writes to a custom mode output directory', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-dest=custom', `--dest=${dest}`, ...svgFiles]);

        assert.equal(fs.existsSync(path.join(dest, 'custom', 'sprite.css')), true);
        assert.equal(fs.existsSync(path.join(dest, 'custom', 'svg', 'sprite.css.svg')), true);
      });
    });

    it('creates a vertical sprite layout', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-layout=vertical', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-two {[\s\S]*?0 100% no-repeat/);
      });
    });

    it('creates a horizontal sprite layout', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-layout=horizontal', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-two {[\s\S]*?100% 0 no-repeat/);
      });
    });

    it('adds a common selector rule for all shapes', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-common=all-icons', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.all-icons {/);
      });
    });

    it('creates a preprocessor mixin for all shapes', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-scss', '--css-bust=false', '--css-mixin=svg-sprite', `--dest=${dest}`, ...svgFiles]);

        const scss = readFile(path.join(dest, 'css', 'sprite.scss'));
        assert.match(scss, /@mixin svg-sprite {/);
        assert.match(scss, /@include svg-sprite;/);
      });
    });

    it('uses a custom CSS selector prefix', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-prefix=.icn-%s', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.icn-one {/);
        assert.doesNotMatch(css, /\.svg-one {/);
      });
    });

    it('inlines the shape dimensions', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-dimensions=', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-one {[\s\S]*width: 24px;/);
        assert.doesNotMatch(css, /\.svg-one-dims/);
      });
    });

    it('uses a custom sprite path and filename', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', '--css-bust=false', '--css-sprite=sp.svg', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /url\("sp\.svg"\)/);
        assert.equal(fs.existsSync(path.join(dest, 'css', 'sp.svg')), true);
      });
    });

    it('adds a cache-busting hash by default', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-css', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /url\("svg\/sprite\.css-[a-f\d]+\.svg"\)/);

        const spriteFiles = fs.readdirSync(path.join(dest, 'css', 'svg'));
        assert.equal(spriteFiles.includes('sprite.css.svg'), false);
        assert.match(spriteFiles.join(' '), /sprite\.css-[a-f\d]+\.svg/);
      });
    });
  });

  describe('stylesheets and example documents', () => {
    it('renders Sass, LESS and Stylus stylesheets', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--css', '--css-render-scss', '--css-render-less', '--css-render-styl', '--css-bust=false', `--dest=${dest}`, ...svgFiles]);

        const scss = readFile(path.join(dest, 'css', 'sprite.scss'));
        assert.match(scss, /\.svg-one/);

        const less = readFile(path.join(dest, 'css', 'sprite.less'));
        assert.match(less, /\.svg-one/);

        const styl = readFile(path.join(dest, 'css', 'sprite.styl'));
        assert.match(styl, /\.svg-one/);
      });
    });

    it('renders stylesheets in every mode', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--css',
          '--view',
          '--defs',
          '--symbol',
          '--stack',
          '--css-render-css',
          '--view-render-css',
          '--defs-render-css',
          '--symbol-render-css',
          '--stack-render-css',
          '--css-bust=false',
          '--view-bust=false',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        for (const mode of ['css', 'view', 'defs', 'symbol', 'stack']) {
          assert.match(readFile(path.join(dest, mode, 'sprite.css')), /svg-one/);
        }
      });
    });

    it('uses a custom stylesheet template and destination', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--css',
          '--css-render-css',
          '--css-bust=false',
          '--css-render-css-template',
          path.join(fixtureDir, 'custom.css.mustache'),
          '--css-render-css-dest',
          'custom.css',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const custom = readFile(path.join(dest, 'css', 'custom.css'));
        assert.equal(custom, 'CUSTOM CSS TEMPLATE');
      });
    });

    it('uses a custom example template and destination', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--css',
          '--css-render-css',
          '--css-example',
          '--css-bust=false',
          '--css-example-template',
          path.join(fixtureDir, 'custom.html.mustache'),
          '--css-example-dest',
          'preview.html',
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const preview = readFile(path.join(dest, 'css', 'preview.html'));
        assert.equal(preview, 'CUSTOM HTML EXAMPLE');
      });
    });

    it('renders example documents for every mode', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-example', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--defs', '--defs-example', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--view', '--view-example', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--stack', '--stack-example', `--dest=${dest}`, ...svgFiles]);

        assert.match(readFile(path.join(dest, 'symbol', 'sprite.symbol.html')), /<html/i);
        assert.match(readFile(path.join(dest, 'defs', 'sprite.defs.html')), /<html/i);
        assert.match(readFile(path.join(dest, 'view', 'sprite.view.html')), /<html/i);
        assert.match(readFile(path.join(dest, 'stack', 'sprite.stack.html')), /<html/i);
      });
    });
  });

  describe('inline sprites and variables', () => {
    it('creates an inline defs sprite variant', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', '--defs-inline', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'defs', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /style="position:absolute"/);
      });
    });

    it('creates an inline symbol sprite variant', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-inline', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /style="position:absolute"/);
      });
    });

    it('passes Mustache variables to templates', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--symbol',
          '--symbol-example',
          '--symbol-example-template',
          path.join(fixtureDir, 'author.html.mustache'),
          '--symbol-example-dest',
          'preview.html',
          '--variables',
          path.join(fixtureDir, 'vars.json'),
          `--dest=${dest}`,
          ...svgFiles
        ]);

        const preview = readFile(path.join(dest, 'symbol', 'preview.html'));
        assert.equal(preview, 'AUTHOR=FIXED');
      });
    });
  });

  describe('short aliases', () => {
    it('accepts the short argument syntax', async() => {
      await withTempDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['-c', '-D', dest, '--ccss', '--cx', '--css-bust=false', ...svgFiles]);

        const css = readFile(path.join(dest, 'css', 'sprite.css'));
        assert.match(css, /\.svg-one {/);

        const example = readFile(path.join(dest, 'css', 'sprite.css.html'));
        assert.match(example, /<html/i);
      });
    });
  });
});
