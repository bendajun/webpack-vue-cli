// eslint-disable-next-line @typescript-eslint/no-var-requires
const autoprefixer = require('autoprefixer');
module.exports = {
  plugins: [
    autoprefixer(), // 添加浏览器前缀
    /* require("cssnano")({
      preset: ['default', {
        mergeLonghand: false,
        cssDeclarationSorter: false
      }]
    }) */
  ]
};
