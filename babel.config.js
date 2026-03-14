module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // ⚠️ Reanimated plugin phải để cuối cùng
      "react-native-reanimated/plugin",
    ],
  };
};
