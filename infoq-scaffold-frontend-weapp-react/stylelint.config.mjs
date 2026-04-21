/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-recommended-scss'],
  customSyntax: 'postcss-scss',
  rules: {
    'declaration-property-value-no-unknown': null,
    'scss/load-partial-extension': null,
    'selector-type-no-unknown': [true, { ignoreTypes: ['page'] }],
    'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }]
  }
};
