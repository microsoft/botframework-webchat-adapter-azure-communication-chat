import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import eslintJs from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import esLintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig([
  eslintJs.configs.recommended,
  typescriptEslint.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      eqeqeq: 'warn',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_' }]
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  globalIgnores(['docs', 'dist', 'node_modules', 'public', '*.js']),
  esLintConfigPrettier
]);
