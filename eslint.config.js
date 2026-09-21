import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    name: 'app/ignore',
    ignores: ['**/dist/**', '**/node_modules/**', '**/.netlify/**', '**/coverage/**']
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    name: 'app/node-env',
    files: [
      'netlify/functions/**/*.js',
      'vite.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'eslint.config.js',
      'playwright.config.js',
      'tests/e2e/**/*.js'
    ],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    name: 'app/browser-env',
    files: ['src/**/*.js', 'src/**/*.vue'],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    name: 'app/formatting-overrides',
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  eslintConfigPrettier
]
