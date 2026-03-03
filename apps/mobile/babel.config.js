module.exports = function (api) {
  api.cache(true);

  return {
    // Load Expo + NativeWind through presets to avoid
    // ".plugins is not a valid Plugin property" issues.
    presets: [
      'babel-preset-expo',
      'nativewind/babel',
    ],
    // Keep Expo Router as a plugin, resolved from the monorepo root.
    plugins: [require.resolve('expo-router/babel')],
  };
};

