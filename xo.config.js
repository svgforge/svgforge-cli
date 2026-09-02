const xoConfig = [
  {
    name: 'svgforge-cli/options',
    space: true,
  },
  {
    name: 'svgforge-cli/rules',
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      // Project-specific jsdoc additions on top of xo defaults.
      'require-unicode-regexp': ['error', {requireFlag: 'u'}],
      'jsdoc/no-undefined-types': ['error', {definedTypes: ['SVGSpriter', 'File', 'SVGShape', 'SVGSprite', 'playwright', 'HTMLElement', 'Yargs']}],
      'jsdoc/check-values': ['error', {allowedLicenses: ['MIT https://github.com/joeda1/svgforge-cli/blob/main/LICENSE']}],
    },
  },
  {
    name: 'svgforge-cli/test-overrides',
    files: ['test/**'],
    rules: {
      'jsdoc/require-returns': 'off',
    },
  },
  {
    name: 'svgforge-cli/ignore-non-code',
    ignores: ['**/*.md', '**/*.json', '**/coverage/**', '**/test/fixtures/**'],
  },
];

export default xoConfig;
