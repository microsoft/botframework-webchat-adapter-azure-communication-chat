module.exports = function (api) {
  api.cache(true);
  const presets = [
    '@babel/preset-typescript',
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        targets: {
          ie: '11',
          edge: '17',
          firefox: '60',
          chrome: '67',
          safari: '11.1'
        },
        useBuiltIns: 'entry',
        corejs: 3
      }
    ]
  ];
  const plugins = [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-async-to-generator',
    '@babel/plugin-transform-modules-commonjs',
    'babel-plugin-transform-globalthis',
    '@babel/transform-runtime'
  ];
  return {
    presets,
    plugins
  };
};
