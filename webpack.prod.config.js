const path = require('path');
const Config = require('webpack-chain');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = new Config();
const publicPath = '/';

config
  .mode('production')
  .context(path.resolve(__dirname, '.')) // 指定项目根目录
  .entry('app') // 指定入口文件名称为app
    .add('./src/main.ts') // 入口文件
    .end()
  .output
    .path(path.join(__dirname, './dist')) // webpack打包输出的文件夹
    .filename('js/[name].[contenthash:10].js') // 打包出来的bundle名称为[name].[contenthash:10].js
    .publicPath(publicPath) // 资源文件前缀
    .end()
  .resolve
    .extensions
      .add('.js').add('.jsx').add('.ts').add('.tsx').add('.vue') // 使用着希望文件时，导入时可以省略后缀
      .end()
    .alias // 设置别名
      .set('@', path.resolve(__dirname, './src'))
      .end()
    .end()
  .module
    .rule('js')
      .test(/\.m?jsx?$/) // 对mjs、mjsx、js、jsx文件进行babel配置
      .exclude // 排除node_modules
        .add(filepath => /node_modules/.test(filepath))
        .end()
      .use('babel-loader')
        .loader('babel-loader')
        .end()
      .end()
    .rule('ts') // rule起的名字只是语义化，方便理解，和导出配置或者修改配置时对应
      .test(/\.tsx?$/) // 匹配处理后缀是ts或者tsx结尾的文件
      .use('babel-loader')
        .loader('babel-loader')
        .end()
      .use('ts-loader') // use也是语义化的名字，同rule
        .loader('ts-loader') // 这里才是使用ts-loader去处理匹配的文件
        .options({ // 这里对ts-loader进行相关的配置, 创建个tsconfig.json文件，默认会读取和使用这个文件
          transpileOnly: true, // 开启时: 编译器仅做语言转换不做类型检查，加快编译速度，但是静态类型检查中获得的许多好处将丢失。所以结合插件ForkTsCheckerWebpackPlugin用于新建进程执行类型检查，为此你需要关闭ts-loader自身的类型检查功能，即设置transpileOnly为true。
          appendTsSuffixTo: ['\\.vue$'], // 给vue文件添加个.ts或.tsx后缀，vue单文件组件中假如使用了 lang="ts"， ts-loader需要配置 appendTsSuffixTo: [/\.vue$/]，用来给 .vue文件添加个 .ts后缀用于编译，因为tsc不知道如何处理. vue文件结尾的文件
        })
        .end()
      .end()
    .rule('vue')
      .test(/\.vue$/) // 匹配处理.vue后缀文件
      .use('vue-loader')
        .loader('vue-loader')
        .end()
      .end()
    .rule('sass')
      .test(/\.(sass|scss)$/) // 处理sass和scss文件
      .use('mini-css-extract-plugin-loader') // 生产环境用MiniCssExtractPlugin这个插件中的一个loader取代style-loader。作用：提取js中的css成单独文件，这样页面上也不是创建style标签的形式的，而是通过link标签来加载css，解决了白屏的效果
        .loader(require('mini-css-extract-plugin').loader)
        .end()
      .use("css-loader") // 处理css
        .loader("css-loader")
        .end()
        /**
         * autofixer是postcss的功能插件，主要是给css中的一些属性添加-webkit-这种前缀做兼容的，postcss-loader则是webpack的loader组件，主要作用是webpack在读取css模块的时候调用postcss和postcss的插件对css内容做兼容性处理的。
         * postcss-loader配置options的过程实际上是为postcss配置需要的插件
         */
      .use('postcss-loader') // 兼容性处理css
        .loader('postcss-loader')
        .options({
          postcssOptions: { // 指定配置文件，如果不指定的话其实是默认去根路径找postcss.config.js这个文件的，指定的好处就是可以指定特定的文件名
            config: path.resolve(__dirname, './postcss.config.js')
          }
        })
        .end()
      .use('sass-loader') // 先将sass语法转换为css语法
        .loader('sass-loader')
        .end()
      .end()
    .rule('images') // 处理png|jpe?g|gif|webp图片 处理图片需要安装 url-loader file-loader，安装file-loader的原因是url-loader是依赖它
      .test(/\.(png|jpe?g|gif|webp)$/)
      .use('url-loader')
        .loader('url-loader')
        .options({
          limit: 8 * 1024,  // 当图片大小小于8kb，就会被处理为base64位字符串，优点：减少请求数量(减轻服务器压力)，缺点：图片体积会更大(文件加载速度更慢)
          name: '[hash:10].[ext]', // [ext]取文件原来扩展名
          outputPath: 'imgs', // 放在img文件夹下
        })
        .end()
      .end()
    .rule('icons')
      .test(/\.svg$/) // 处理svg图片
      .include
        .add(path.resolve(__dirname, './src/icons')) // 处理的svg放在此路径下
        .end()
      .use('svg-sprite-loader')
        .loader('svg-sprite-loader')
        .options({
          symbolId: 'icon-[name]'
        })
        .end()
      .use('svgo-loader')
        .loader('svgo-loader')
        .end()
      .end()
    .rule('html') // html-loader是专门处理html文件中的img图片(负责引入img，从而能被url-loader进行处理)
      .test(/\.html$/)
      .use('html-loader')
        .loader('html-loader')
        .end()
      .end()
    .rule('other') // 打包其他资源(除了html/js/css等资源以外的资源)，将这些资源不压缩，不转换统一打包过去,相当于复制过去
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf|txt|word|excel)(\?.*)?$/i)
      .use('file-loader')
      .loader('file-loader') // 用file-loader来处理这些其他资源,可以原封不动的打包过去
      .options({
        name: '[hash:10].[ext]',
      })
      .end()
    .end()
  config
    .plugin('fork-ts-checker')
      .use(ForkTsCheckerWebpackPlugin, [{ // 插件ForkTsCheckerWebpackPlugin用于新建进程执行类型检查，为此你需要关闭ts-loader自身的类型检查功能，即设置transpileOnly为true
        eslint: { // 这个是结合eslint使用时的
          files: './src/**/*.{ts,tsx,js,jsx}' // required - same as command `eslint ./src/**/*.{ts,tsx,js,jsx} --ext .ts,.tsx,.js,.jsx`
        },
        typescript: {
          extensions: {
            vue: {
              enabled: true, // 如果为true，则启用Vue单个文件组件支持。
              compiler: '@vue/compiler-sfc', // 默认值，用于解析.vue文件的编译器的程序包名称
            },
            diagnosticOptions: {
              semantic: true,
              syntactic: false
            }
          }
        }
      }])
      .end()
    .plugin('vue-loader-plugin') // vue-loader必须要添加vue-loader-plugin
      .use(require('vue-loader').VueLoaderPlugin, [])// 是将你定义过的其它规则复制并应用到 .vue 文件里相应语言的块。例如，如果你有一条匹配 /\.js$/ 的规则，那么它会应用到 .vue 文件里的 <script> 块。
      .end()
    .plugin('html') // 添加html-webpack-plugin插件
      .use(require('html-webpack-plugin'), [{
        template: path.resolve(__dirname, './public/index.html'),
        inject: 'body', // 制定script脚本注入的位置为body
      }])
      .end()
    .plugin('mini-css-extract-plugin') // 生产环境将css从js提取到单独的css文件中
      .use(require('mini-css-extract-plugin'), [{
        filename: 'css/[name].[contenthash:10].css',
        chunkFilename: 'css/[name].[contenthash:10].css',
      }])
      .end()
    .plugin('clean')
      .use(CleanWebpackPlugin) // 每次打包之前清除之前的打包资源，也就是dist文件下的文件
      .end()
  config
    .devtool('hidden-source-map') // 错误代码错误原因，但是没有错误位置不能追踪源代码错误，只能提示到构建后代码的错误位置
  config
  .optimization
    .set('chunkIds', 'named') // 设置动态加载的文件名字了，不再是 id，而是改为项目路径的拼接
    .runtimeChunk('single') // 将当前模块的记录其他模块的hash单独打包为一个文件 runtime....js,解决了如改动a文件导致b文件的contenthash变化。runtimeChunk作用是为了线上更新版本时，充分利用浏览器缓存，使用户感知的影响到最低。
    .splitChunks({
      chunks: 'all',
      /* 默认值可以不写
      minSize: 30 * 1024, // 分割的chunk最小为30kb
      maxSiza: 0, // 最大没有限制
      minChunks: 1, // 要提取的chunk最少被引用1次
      maxAsyncRequests: 5, // 按需加载时并行加载的文件的最大数量
      maxInitialRequests: 3, // 入口js文件最大并行请求数量
      automaticNameDelimiter: '~', // 名称连接符
      name: true, // 可以使用命名规则 */
      cacheGroups: {
        components: {
          name: 'chunk-components',
          test: path.resolve(__dirname, './src/components'),
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // 分割chunk的组
        // node_modules文件会被打包到 libs 组的chunk中。--> chunk-vendors~xxx.js
        // 满足上面的公共规则，如：大小超过30kb，至少被引用一次。
        libs: { // 分离入口文件引用node_modules的第三方包
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2, // 分离入口文件引用次数>=2 的module
          priority: -20, // 优先级
          chunks: 'initial',
          reuseExistingChunk: true // 当chunks引用了已经存在的被抽离的chunks时不会新创建一个chunk而是复用chunk
        },
        icons: {
          name: 'chunk-icons',
          test: path.resolve(__dirname, './src/icons'),
          priority: 20,
        },
      }
    })
module.exports = config.toConfig();
