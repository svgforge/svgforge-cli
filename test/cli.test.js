import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, it} from 'node:test';
import {execCli, makeTemporaryDir} from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, 'fixtures');
const svgFiles = ['one.svg', 'two.svg'].map(file => path.join(fixtureDir, file));

/**
 Run an assertion callback inside a fresh temporary directory

 @param {() => Promise<void>} callback Assertion callback receiving the directory
 @returns {Promise<void>} Promise resolving after the callback finished
 */
async function withTemporaryDir(callback) {
  const dir = makeTemporaryDir();

  try {
    await callback(dir);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

/**
 Check that a file exists and return its contents

 @param {string} filePath Absolute path to the file
 @returns {string} File contents
 */
function readFile(filePath) {
  assert.equal(fs.existsSync(filePath), true, `Missing file: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

describe('svgforge-cli', () => {
  describe('basic usage', () => {
    it('prints the version', async () => {
      const {stdout} = await execCli(['--version']);
      // eslint-disable-next-line regexp/no-super-linear-move -- Version output is a bounded, non-attacker-controlled fixture pattern.
      assert.match(stdout, /\d+\.\d+\.\d+/u);
    });

    it('prints usage information for --help', async () => {
      const {stdout} = await execCli(['--help']);
      assert.match(stdout, /^Usage:/mu);
      assert.doesNotMatch(stdout, /--css/u);
    });

    it('fails when no files are provided', async () => {
      await assert.rejects(execCli([]), /error/iu);
    });
  });

  describe('sprite generation', () => {
    it('creates a defs sprite with a stylesheet', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--defs',
          '--defs-render-css',
          '--defs-bust=false',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const css = readFile(path.join(dest, 'defs', 'sprite.css'));
        assert.match(css, /\.svg-one-dims\s*\{/u);
        assert.match(css, /\.svg-two-dims\s*\{/u);

        const sprite = readFile(path.join(dest, 'defs', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /^<\?xml/u);
        assert.match(sprite, /<svg/u);
        assert.match(sprite, /id="one"/u);
        assert.match(sprite, /id="two"/u);
      });
    });

    it('renders a stylesheet example document on request', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--defs',
          '--defs-render-css',
          '--defs-example',
          '--defs-bust=false',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const example = readFile(path.join(dest, 'defs', 'sprite.defs.html'));
        assert.match(example, /<html/iu);
        assert.match(example, /sprite.css.svg/u);
      });
    });

    it('creates a symbol sprite', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<symbol viewBox="0 0 24 24" id="one"/u);
        assert.match(sprite, /<symbol viewBox="0 0 24 24" id="two"/u);
      });
    });

    it('creates a defs sprite', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'defs', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<defs>/u);
        assert.match(sprite, /id="one"/u);
        assert.match(sprite, /id="two"/u);
      });
    });

    it('creates a stack sprite', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--stack', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'stack', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /:root>svg:target/u);
        assert.match(sprite, /id="one"/u);
        assert.match(sprite, /id="two"/u);
      });
    });

    it('creates a view sprite', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.view.svg'));
        assert.match(sprite, /<view id="one" viewBox="0 0 24 24"/u);
        assert.match(sprite, /<view id="two"/u);
      });
    });

    it('renders a dimension stylesheet for the view mode', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--view',
          '--view-render-css',
          '--view-example',
          '--view-bust=false',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const css = readFile(path.join(dest, 'view', 'sprite.css'));
        assert.match(css, /\.svg-one-dims\s*\{[^}]*width: 24px/u);
        assert.match(css, /\.svg-two-dims\s*\{[^}]*width: 24px/u);

        const example = readFile(path.join(dest, 'view', 'sprite.view.html'));
        assert.match(example, /class="svg-one-dims"|class="svg-two-dims"/u);
      });
    });

    it('creates only the requested sprite modes', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);

        assert.equal(fs.existsSync(path.join(dest, 'view', 'svg', 'sprite.view.svg')), true);
        assert.equal(fs.existsSync(path.join(dest, 'defs')), false);
        assert.equal(fs.existsSync(path.join(dest, 'symbol')), false);
        assert.equal(fs.existsSync(path.join(dest, 'stack')), false);
      });
    });

    it('generates multiple sprite modes in one run', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--symbol', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);

        assert.equal(fs.existsSync(path.join(dest, 'view', 'svg', 'sprite.view.svg')), true);
        assert.equal(fs.existsSync(path.join(dest, 'symbol', 'svg', 'sprite.css.svg')), true);
      });
    });
  });

  describe('configuration', () => {
    it('loads an external JSON config file', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--config',
          path.join(fixtureDir, 'config.json'),
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const css = readFile(path.join(dest, 'symbol', 'sprite.css'));
        assert.match(css, /\.svg-one/u);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<symbol/u);
      });
    });

    it('applies custom SVG root attributes from a JSON file', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--symbol',
          '--svg-rootattrs',
          path.join(fixtureDir, 'svg-rootattrs.json'),
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<svg[^>]*data-testid="sprite-root"/u);
      });
    });
  });

  describe('options', () => {
    it('applies shape padding', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--symbol',
          '--shape-spacing-padding=5',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /viewBox="-5 -5 34 34"/u);
        assert.match(sprite, /id="one"/u);
      });
    });
  });

  describe('logging', () => {
    it('writes log output when --log is set', async () => {
      const {stdout} = await execCli(['--symbol', '--log=info', ...svgFiles]);
      assert.match(stdout, /Created spriter/u);
    });
  });

  describe('shape identifier options', () => {
    it('traverses directory structures into shape IDs', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', `--dest=${dest}`, './nested/**/*.svg'], {cwd: fixtureDir});

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="nested--leaf"/u);
      });
    });

    it('applies a custom shape ID separator', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-separator=__', `--dest=${dest}`, './nested/**/*.svg'], {cwd: fixtureDir});

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="nested__leaf"/u);
        assert.doesNotMatch(sprite, /id="nested--leaf"/u);
      });
    });

    it('applies a custom shape ID generator', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-generator=%s-icon', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="one-icon"/u);
        assert.match(sprite, /id="two-icon"/u);
      });
    });

    it('replaces whitespace in shape IDs', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-id-whitespace=-', `--dest=${dest}`, path.join(fixtureDir, 'with space.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="with-space"/u);
      });
    });

    it('uses a custom CSS pseudo class separator', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', '--defs-render-css', '--defs-bust=false', `--dest=${dest}`, path.join(fixtureDir, 'button~hover.svg')]);

        const css = readFile(path.join(dest, 'defs', 'sprite.css'));
        assert.match(css, /\.svg-button-dims:hover/u);
      });
    });
  });

  describe('shape dimension and spacing options', () => {
    it('scales shapes to the maximum dimensions', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', '--defs-render-css', '--defs-bust=false', '--shape-dim-width=12', '--shape-dim-height=12', `--dest=${dest}`, ...svgFiles]);

        const css = readFile(path.join(dest, 'defs', 'sprite.css'));
        assert.match(css, /\.svg-one-dims \{\s*width: 12px;\s*height: 12px;/u);
        assert.match(css, /\.svg-two-dims \{\s*width: 12px;\s*height: 12px;/u);
      });
    });

    it('rounds shape dimensions to the given precision', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', '--defs-render-css', '--defs-bust=false', '--shape-dim-precision=1', `--dest=${dest}`, path.join(fixtureDir, 'half.svg')]);

        const css = readFile(path.join(dest, 'defs', 'sprite.css'));
        assert.match(css, /width: 24\.4px;/u);
        assert.match(css, /height: 12\.1px;/u);
      });
    });

    it('accepts the shape dimension attributes option', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', '--shape-dim-attributes', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.view.svg'));
        assert.match(sprite, /width="24" height="24"/u);
      });
    });

    it('applies spacing box padding', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', '--shape-spacing-padding=4', '--shape-spacing-box=padding', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.view.svg'));
        assert.match(sprite, /viewBox="-4 -4 32 32"/u);
      });
    });
  });

  describe('shape file options', () => {
    it('adds meta data from a YAML file', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-meta', path.join(fixtureDir, 'meta.yaml'), `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /aria-labelledby=/u);
        assert.match(sprite, /<title[^>]*>Alpha<\/title>/u);
        assert.match(sprite, /<desc[^>]*>First icon<\/desc>/u);
      });
    });

    it('writes intermediate SVG files to a custom destination', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-dest=intermediate', `--dest=${dest}`, ...svgFiles]);

        const intermediate = readFile(path.join(dest, 'intermediate', 'one.svg'));
        assert.match(intermediate, /^<\?xml/u);
      });
    });

    it('applies a custom SVGO transform configuration', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=svgo', '--shape-transform-svgo', path.join(fixtureDir, 'svgo.config.json'), `--dest=${dest}`, path.join(fixtureDir, 'comment.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<!--KEEP-SPECIAL-->/u);
      });
    });
  });

  describe('svg output options', () => {
    it('omits the XML declaration on request', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--svg-xmldecl=false', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.doesNotMatch(sprite, /^<\?xml/u);
      });
    });

    it('omits the doctype declaration on request', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-bust=false', `--dest=${dest}`, path.join(fixtureDir, 'doctype.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /<!DOCTYPE/u);
      });

      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-bust=false', '--svg-doctype=false', `--dest=${dest}`, path.join(fixtureDir, 'doctype.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.doesNotMatch(sprite, /<!DOCTYPE/u);
      });
    });

    it('disables ID namespacing', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-ids=false', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="arrow"/u);
        assert.match(sprite, /href="#arrow"/u);
      });
    });

    it('disables CSS class namespacing', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-classnames=false', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /class="ic"/u);
      });
    });

    it('applies a namespace ID prefix', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--shape-transform=', '--svg-namespace-prefix=p-', `--dest=${dest}`, path.join(fixtureDir, 'ref.svg')]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /id="p-aarrow"/u);
        assert.match(sprite, /href="#p-aarrow"/u);
      });
    });

    it('omits sprite dimension attributes on request', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--view', '--view-bust=false', '--svg-dimattrs=false', `--dest=${dest}`, path.join(fixtureDir, 'one.svg')]);

        const sprite = readFile(path.join(dest, 'view', 'svg', 'sprite.view.svg'));
        const rootOpen = sprite.slice(0, sprite.indexOf('>'));
        assert.doesNotMatch(rootOpen, /width="/u);
        assert.doesNotMatch(rootOpen, /height="/u);
      });
    });
  });

  describe('stylesheets and example documents', () => {
    it('renders stylesheets in every mode', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--defs',
          '--symbol',
          '--stack',
          '--defs-render-css',
          '--symbol-render-css',
          '--stack-render-css',
          '--defs-bust=false',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        for (const mode of ['defs', 'symbol', 'stack']) {
          // eslint-disable-next-line node-test/no-conditional-assertion -- Assertion per fixed, known mode list (not a runtime conditional).
          assert.match(readFile(path.join(dest, mode, 'sprite.css')), /svg-one/u);
        }
      });
    });

    it('uses a custom stylesheet template and destination', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--defs',
          '--defs-render-css',
          '--defs-bust=false',
          '--defs-render-css-template',
          path.join(fixtureDir, 'custom.css.mustache'),
          '--defs-render-css-dest',
          'custom.css',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const custom = readFile(path.join(dest, 'defs', 'custom.css'));
        assert.equal(custom, 'CUSTOM CSS TEMPLATE');
      });
    });

    it('uses a custom example template and destination', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli([
          '--view',
          '--view-example',
          '--view-bust=false',
          '--view-example-template',
          path.join(fixtureDir, 'custom.html.mustache'),
          '--view-example-dest',
          'preview.html',
          `--dest=${dest}`,
          ...svgFiles,
        ]);

        const preview = readFile(path.join(dest, 'view', 'preview.html'));
        assert.equal(preview, 'CUSTOM HTML EXAMPLE');
      });
    });

    it('renders example documents for every mode', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-example', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--defs', '--defs-example', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--view', '--view-example', '--view-bust=false', `--dest=${dest}`, ...svgFiles]);
        await execCli(['--stack', '--stack-example', `--dest=${dest}`, ...svgFiles]);

        assert.match(readFile(path.join(dest, 'symbol', 'sprite.symbol.html')), /<html/iu);
        assert.match(readFile(path.join(dest, 'defs', 'sprite.defs.html')), /<html/iu);
        assert.match(readFile(path.join(dest, 'view', 'sprite.view.html')), /<html/iu);
        assert.match(readFile(path.join(dest, 'stack', 'sprite.stack.html')), /<html/iu);
      });
    });
  });

  describe('inline sprites and variables', () => {
    it('creates an inline defs sprite variant', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--defs', '--defs-inline', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'defs', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /style="position:absolute"/u);
      });
    });

    it('creates an inline symbol sprite variant', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['--symbol', '--symbol-inline', `--dest=${dest}`, ...svgFiles]);

        const sprite = readFile(path.join(dest, 'symbol', 'svg', 'sprite.css.svg'));
        assert.match(sprite, /style="position:absolute"/u);
      });
    });

    it('passes Mustache variables to templates', async () => {
      await withTemporaryDir(async dir => {
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
          ...svgFiles,
        ]);

        const preview = readFile(path.join(dest, 'symbol', 'preview.html'));
        assert.equal(preview, 'AUTHOR=FIXED');
      });
    });
  });

  describe('short aliases', () => {
    it('accepts the short argument syntax', async () => {
      await withTemporaryDir(async dir => {
        const dest = path.join(dir, 'out');
        await execCli(['-d', '-D', dest, '--dcss', '--dx', '--defs-bust=false', ...svgFiles]);

        const css = readFile(path.join(dest, 'defs', 'sprite.css'));
        assert.match(css, /\.svg-one-dims \{/u);

        const example = readFile(path.join(dest, 'defs', 'sprite.defs.html'));
        assert.match(example, /<html/iu);
      });
    });
  });
});
