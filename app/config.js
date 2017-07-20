const path = require('path');

const srcPath = path.resolve(__dirname, '../src');

module.exports = {
  mainWindowConfig: {
    windowOptions: {
      width: 800,
      height: 600,
      webPreferences: {
        backgroundThrottling: false,
      },
    },
    fileUrl: `file://${srcPath}/index.html`,
  },
};
