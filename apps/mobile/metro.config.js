// Expo SDK 52+ configura el monorepo solo (watchFolders, nodeModulesPaths).
// No agregar resolución manual: ver https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
