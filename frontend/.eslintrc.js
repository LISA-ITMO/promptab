module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
		webextensions: true,
	},
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	plugins: ['react', '@typescript-eslint', 'react-hooks'],
	rules: {
		// Performance optimizations
		'react/jsx-no-bind': [
			'error',
			{
				allowArrowFunctions: true,
				allowBind: false,
				ignoreRefs: true,
			},
		],
		'react/jsx-no-leaked-render': 'error',
		'react/jsx-no-useless-fragment': 'error',
		'react/no-array-index-key': 'error',
		'react/no-unstable-nested-components': 'error',
		'react/prefer-stateless-function': 'error',
		'react/self-closing-comp': 'error',

		// TypeScript optimizations
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			},
		],
		'@typescript-eslint/prefer-const': 'error',
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'warn',

		// React Hooks optimizations
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': [
			'warn',
			{
				additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)',
			},
		],

		// General optimizations
		'no-console': 'warn',
		'no-debugger': 'error',
		'no-alert': 'error',
		'no-var': 'error',
		'prefer-const': 'error',
		'no-unused-expressions': 'error',
		'no-duplicate-imports': 'error',
		'no-useless-return': 'error',
		'prefer-template': 'error',
		'template-curly-spacing': 'error',
		'arrow-spacing': 'error',
		'comma-dangle': ['error', 'always-multiline'],
		'object-curly-spacing': ['error', 'always'],
		'array-bracket-spacing': ['error', 'never'],
		'indent': ['error', 'tab'],
		'quotes': ['error', 'single'],
		'semi': ['error', 'always'],
		'no-trailing-spaces': 'error',
		'eol-last': 'error',
		'no-multiple-empty-lines': ['error', { max: 1 }],
		'no-empty': 'error',
		'no-empty-function': 'error',
		'no-extra-semi': 'error',
		'no-irregular-whitespace': 'error',
		'no-mixed-spaces-and-tabs': 'error',
		'no-unreachable': 'error',
		'no-unsafe-negation': 'error',
		'valid-typeof': 'error',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	overrides: [
		{
			files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
			env: {
				jest: true,
			},
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'no-console': 'off',
			},
		},
		{
			files: ['webpack.config.js', 'scripts/**/*.js'],
			env: {
				node: true,
			},
			rules: {
				'@typescript-eslint/no-var-requires': 'off',
				'no-console': 'off',
			},
		},
	],
}; 