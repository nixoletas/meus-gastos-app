module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // O plugin de worklets precisa ser o ÚLTIMO da lista (requisito do Reanimated 4).
    plugins: ['react-native-worklets/plugin'],
  };
};
