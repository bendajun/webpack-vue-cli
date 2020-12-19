const path = require('path');
const webpack = require('webpack');
const Config = require('webpack-chain');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = new Config();
const publicPath = '/';
// webpack-cli4 + webpack5 启动devServe是webpack serve了，而不是webpack-dev-server
// webpack5 内部实现了cache-loader的效果

config
  .target('web') // webpack5需要加这个，不然热更新不会手动刷新页面
  .mode('development')
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
      .set('vue$', 'vue/dist/vue.runtime.esm-bundler.js') // 开发环境使用这个vue.js，参照vue-cli的vue3项目
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
          happyPackMode: false,
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
      .use('style-loader') // 开发环境用:style-loader 是将js中的css文件提取出来，放在style标签中，style-loader内部实现了热模块替换(HMR,一个模块发生变化，只会重新打包这一个模块(而不是打包所有模块))
        .loader('style-loader')
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
    .rule('eslint')
      .exclude
        .add(/node_modules/)
        .end()
      .test(/\.(vue|(j|t)sx?)$/)// 处理.vue、.js、.jsx、.ts、.tsx文件
      .use('eslint-loader')
        .loader(require.resolve('eslint-loader'))
        .options({
          emitWarning: false, // 出现警告是否终止webpack编译
          emitError: true,
        })
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
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
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
              compiler: '@vue/compiler-sfc' // 默认值是vue-template-compiler，不适用于vue3，用于解析.vue文件的编译器的程序包名称
            }
          },
          diagnosticOptions: {
            semantic: true,
            syntactic: false
          }
        }
      }])
      .end()
    .plugin('vue-loader-plugin') // vue-loader必须要添加vue-loader-plugin
      .use(require('vue-loader').VueLoaderPlugin, [])// 是将你定义过的其它规则复制并应用到 .vue 文件里相应语言的块。例如，如果你有一条匹配 /\.js$/ 的规则，那么它会应用到 .vue 文件里的 <script> 块。
      .end()
    .plugin('vue-feature-flags') // 不加这个影响不大，这个是我看vue-cli配置了的，不加的话会有警告
      .use(webpack.DefinePlugin, [{
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        'process.env': {
          NODE_ENV: '"development"',
          BASE_URL: '"/"'
        }
      }])
      .end()
    .plugin('html') // 添加html-webpack-plugin插件
      .use(require('html-webpack-plugin'), [{
        template: path.resolve(__dirname, './public/index.html'),
        inject: 'body', // 制定script脚本注入的位置为body
      }])
      .end()
    .devServer
      .contentBase(path.resolve(__dirname, '.')) // 默认是当前的工作目录，当它查不到打包在内存中的资源的时候，它就会到contentBase中去找
      // .publicPath(publicPath) // evServer中的publicPath设置的是资源会被打包到哪里 这样就会打包到 localhost:8888/publicPath 下面，也就是index.html在这个文件夹下。如果devServer没了publicPath，那么资源就会打包到localhost:8888/output.publicPath下
      .port(8888) // 端口号
      .compress(true) // 启动gzip压缩，能够让代码体积更小，从而热更新的速度更快
      .hot(true) // 热重载，每次修改代码js后只更新当前更改的js文件
      .overlay({
        warnings: false,
        errors: true
      }) //webpack错误和警告信息显示到页面，webpack5好像没有生效，还在排查问题。
      .open(true) // 自动打开页面
      .end()
  config
    .devtool('eval-cheap-module-source-map') // 速度快(eval>inline>cheap>...) 错误代码准确信息 和 源代码的错误位置 精确到行


module.exports = config.toConfig();
