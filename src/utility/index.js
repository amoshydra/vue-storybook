const storyLoader = require.resolve("../story-loader.js");

/**
 * 
 * @param {Array} moduleRules 
 */
const getVueTargettedRules = (moduleRules) => {
  return moduleRules.filter(({ test }) => {
    if (!(test instanceof RegExp)) return;
    const isVueFile = test.test('.vue');
    return isVueFile;
  });
};

/**
 * Retreive the configuration syntax used by a webpack module rule to specify its 
 * @param {Object} rule
 * @returns {string} rule use reference. Fallback to 'loaders' if unspecified.
 */
const getRuleUseReference = rule => rule.use
  ? 'use' // Webpack 4
  : 'loaders' // Webpack 3
;

/**
 * Expand string loader syntax into object syntax
 * @param {string | object} loaderItem 
 * @return {object} expanded loader item
 */
const normalizeLoaderItemSyntax = loaderItem => (typeof loaderItem === 'string')
  ? ({ loader: loaderItem })
  : loaderItem
;

/**
 * Expand and normalize rule's use syntax.
 * This functions will convert loader into expanded loaders syntax. example:
 * {
 *   loaders: [{
 *     loader: 'babel-loader',
 *   }]
 * }
 * @param {object} rule - Webpack > module > rules > *
 */
const normalizeLoaderSyntax = (rule) => {
  const ruleUseReference = getRuleUseReference(rule);

  // Normalize loader configuration to Array Object syntax
  rule[ruleUseReference] = [
    ...(rule[ruleUseReference] || []).map(normalizeLoaderItemSyntax),
    ...(rule.loader ? [{
      loader: rule.loader,
      options: rule.options,
    }] : []),
  ];
  
  // Remove unused config
  delete rule.loader;
  delete rule.options;
};

/**
 * Inject storybook options into vue-loader
 * @param {object} rule - Webpack > module > rules > *
 */
const injectVueStorybookOption = (rule) => {
  const ruleUseReference = getRuleUseReference(rule);

  rule[ruleUseReference].forEach((loaderItem) => {
    const isVueLoader = /vue\-loader/.test(loaderItem.loader);
    if (!isVueLoader) return;
    
    loaderItem.options = loaderItem.options || {};
    loaderItem.options.loaders = loaderItem.options.loaders || {}
    loaderItem.options.loaders.story = storyLoader;
  })
};

module.exports = {
  configureWebpack(webpackConfig) {
    const vueTargettedRules = getVueTargettedRules(webpackConfig.module.rules);

    // Configure webpack for Vue Storybook
    vueTargettedRules.forEach(normalizeLoaderSyntax);
    vueTargettedRules.forEach(injectVueStorybookOption);

    console.log(webpackConfig.module.rules);

    return webpackConfig;
  },
};
