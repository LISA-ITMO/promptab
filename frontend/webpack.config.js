const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		mode: isProduction ? 'production' : 'development',
		devtool: isProduction ? 'source-map' : 'eval-source-map',
		entry: {
			popup: './src/popup/index.tsx',
			options: './src/options/index.tsx',
			background: './src/background/index.ts',
			contentScript: './src/contentScript/index.ts',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js', // Keep fixed names for Chrome extension
			clean: true,
		},
		// Enhanced optimization for better performance
		optimization: {
			minimize: isProduction, // Enable minification for production
			usedExports: true,
			sideEffects: false,
			// Enhanced tree shaking
			providedExports: true,
			innerGraph: true,
			// Better code splitting for Chrome extension
			splitChunks: {
				chunks: 'all',
				maxInitialRequests: 10,
				maxAsyncRequests: 10,
				minSize: 20000, // Minimum chunk size
				maxSize: 244000, // Maximum chunk size
				cacheGroups: {
					// Separate MUI and Emotion into their own chunk
					mui: {
						test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
						name: 'mui',
						priority: 20,
						reuseExistingChunk: true,
						enforce: true,
					},
					// React and React-DOM
					react: {
						test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
						name: 'react',
						priority: 15,
						reuseExistingChunk: true,
						enforce: true,
					},
					// React Query
					reactQuery: {
						test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
						name: 'react-query',
						priority: 14,
						reuseExistingChunk: true,
						enforce: true,
					},
					// Other vendor libraries
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						priority: 10,
						reuseExistingChunk: true,
						minChunks: 2,
					},
				},
			},
			// Runtime chunk optimization
			runtimeChunk: {
				name: 'runtime',
			},
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: {
						loader: 'ts-loader',
						options: {
							// Enable transpileOnly for faster builds
							transpileOnly: !isProduction,
							// Enable experimental watch API for faster rebuilds
							experimentalWatchApi: true,
						},
					},
					exclude: /node_modules/,
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader'],
				},
				{
					test: /\.(png|svg|jpg|jpeg|gif)$/i,
					type: 'asset/resource',
					// Optimize images
					parser: {
						dataUrlCondition: {
							maxSize: 4 * 1024, // 4kb
						},
					},
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
			alias: {
				'@': path.resolve(__dirname, 'src'),
				'@components': path.resolve(__dirname, 'src/components'),
				'@services': path.resolve(__dirname, 'src/services'),
				'@utils': path.resolve(__dirname, 'src/utils'),
				'@types': path.resolve(__dirname, 'src/types'),
			},
			// Optimize module resolution
			symlinks: false,
			cacheWithContext: false,
		},
		// Performance hints
		performance: {
			hints: isProduction ? 'warning' : false,
			maxEntrypointSize: 512000,
			maxAssetSize: 512000,
		},
		// Cache for faster rebuilds
		cache: {
			type: 'filesystem',
			buildDependencies: {
				config: [__filename],
			},
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: './public/popup.html',
				filename: 'popup.html',
				chunks: ['popup'],
				minify: isProduction ? {
					removeComments: true,
					collapseWhitespace: true,
					removeRedundantAttributes: true,
					useShortDoctype: true,
					removeEmptyAttributes: true,
					removeStyleLinkTypeAttributes: true,
					keepClosingSlash: true,
					minifyJS: true,
					minifyCSS: true,
					minifyURLs: true,
				} : false,
			}),
			new HtmlWebpackPlugin({
				template: './public/options.html',
				filename: 'options.html',
				chunks: ['options'],
				minify: isProduction ? {
					removeComments: true,
					collapseWhitespace: true,
					removeRedundantAttributes: true,
					useShortDoctype: true,
					removeEmptyAttributes: true,
					removeStyleLinkTypeAttributes: true,
					keepClosingSlash: true,
					minifyJS: true,
					minifyCSS: true,
					minifyURLs: true,
				} : false,
			}),
			new CopyWebpackPlugin({
				patterns: [
					{ from: 'manifest.json', to: 'manifest.json' },
					{ from: 'public/icons', to: 'icons' },
					{ from: 'public/_locales', to: '_locales', noErrorOnMissing: true },
					{ from: 'src/contentScript/index.css', to: 'contentScript.css' },
				],
			}),
		],
	};
};
