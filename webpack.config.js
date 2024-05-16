const Dotenv = require("dotenv-webpack");
const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
var webpack = require('webpack');
require('dotenv').config();

var path = require('path');

const APP_NAME = 'solidbench';

// this will create index.html file containing script
// source in dist folder dynamically
const htmlPlugin = new HtmlWebPackPlugin({
    template: './src/index.html',
    filename: './index.html',
    inject: 'body',
    chunks: [APP_NAME],
});

const dotenvPlugin = new Dotenv();

var localVariables;
try {
    localVariables = require('./local-config.json');
} catch (e) {
}
const definePlugin = new webpack.DefinePlugin({
    PROXY_URL: (localVariables && JSON.stringify(localVariables.proxyUrl)) || false
});

const dev = true;

var styleLoader = 'style-loader';
var cssLoader = 'css-loader';


function injectEnv(buffer) {
    // parse the JSON content
    var strValue = buffer.toString();

    return strValue.replaceAll('${process.env.ROOT_URL}', process.env.ROOT_URL)
}

module.exports = {
    // this can be overridden by command line `--mode=production`
    mode: dev ? 'development' : 'production',
    //optimization: {minimize: true},

    //specify the entry point for your project
    entry: {[APP_NAME]: ['./src/index.tsx']},
    // specify the output file name
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        publicPath: '/',
        libraryTarget: 'umd',
        umdNamedDefine: true

    },
    resolve: {
        // this is required to be able to do non relative imports of src code
        // BUT this causes webpack to fail to find hoisted modules higher in the path tree
        //modules: [path.resolve('./src'), path.resolve('./node_modules')],

        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            "url": false,
            "stream": require.resolve("stream-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            //stream: require.resolve('readable-stream'),
            "buffer": require.resolve("buffer"),

        },
        alias: {
            // these are necessary to allow yarn linking of local packages
            // cf https://github.com/facebook/react/issues/14257
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
            'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),


            /*
             WARN !!!
             The following has to be added in the @inrupt/solid-client/package.json#exports :

                    "./dist/acp/util/getAgentAccessAll": {
                      "types": "./dist/acp/util/getAgentAccessAll.d.ts",
                      "import": "./dist/acp/util/getAgentAccessAll.mjs"
                    },
                    "./dist/acl/acl.internal": {
                      "types": "./dist/acl/acl.internal.d.ts",
                      "import": "./dist/acl/acl.internal.mjs"
                    },
                    "./dist/acl/agent": {
                      "types": "./dist/acl/agent.d.ts",
                      "import": "./dist/acl/agent.mjs"
                    },

              to get webpack to find these toolkit-ts dependencies

             */


            //'@hilats/solid-utils': path.resolve(__dirname, '../toolkit-ts/solid-utils'),
            //'@inrupt/solid-client/dist/acp/util/getAgentAccessAll': path.resolve(__dirname, 'node_modules/@inrupt/solid-client/dist/acp/util/getAgentAccessAll'),
            //'@inrupt/solid-client/dist': path.resolve(__dirname, 'node_modules/@inrupt/solid-client/dist'),
        },
        //modules: ['node_modules', '../node_modules'],
        symlinks: false
    },
    target: 'web',
    devtool: 'source-map',
    module: {
        // consists the transform configuration
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
                test: /\.css$/,
                use: [styleLoader, cssLoader]
            },

            {
                test: /\.scss$/,
                use: [styleLoader, cssLoader, 'sass-loader']
            },

            // with webpack 5, use 'asset/resource' to properly bundle resources like fonts or images
            // cf https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin
            { // required for font-awesome
                test: /\.(jpe?g|ttf|png|gif|svg|ico|woff(2)?|eot)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource'
                /*
                loader: "file-loader",
                options: {
                    outputPath: 'assets/',
                    name: '[name].[ext]'
                }

                 */
            },
        ]
    },
    // this will create a development server to host our application
    // and will also provide live reload functionality
    devServer: {
        host: '0.0.0.0',
        static: './dist',
        //contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 8000,
        // needed to properly support BrowsrRouter
        // see https://stackoverflow.com/questions/43209666/react-router-v4-cannot-get-url
        historyApiFallback: {
            // stock historyApiFallback is not enough
            // it chokes on subpaths that contain a dot
            rewrites: [
                {
                    from: /^.*$/,
                    to: function() {
                        return '/';
                    }
                }
            ]
        },
        https: true,


        proxy: {
            "/proxy": {
                //"changeOrigin": true,
                //"cookieDomainRewrite": "localhost",
                "target": 'https://demo.highlatitud.es',
                secure: false,
                changeOrigin: true
            }
        },
        client: {
            overlay: {
                // Ignore ResizeObserver errors
                // see https://github.com/vuejs/vue-cli/issues/7431#issuecomment-1821173102
                runtimeErrors: (error) => {
                    const ignoreErrors = [
                        "ResizeObserver loop limit exceeded",
                        "ResizeObserver loop completed with undelivered notifications.",
                    ];
                    if (ignoreErrors.includes(error.message)) {
                        return false;
                    }
                    return true;
                },
            },
        }
    },

    // this will watch the bundle for any changes
    //watch: true,
    // specify the plugins which you are using
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        htmlPlugin,
        definePlugin,
        new CopyWebpackPlugin({
            patterns: [
                {from: 'static'},
                {
                    from: "./src/client.jsonld",
                    to: "./client.jsonld",
                    transform(content, path) {
                        return injectEnv(content)
                    }
                }
            ]
        }),
        dotenvPlugin,
        new MonacoWebpackPlugin()
    ]
};
