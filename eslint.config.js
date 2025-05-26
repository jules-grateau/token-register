// eslint.config.js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
// import fs from 'node:fs'; // If you were reading .gitignore
// import path from 'node:path';

// const readGitignore = () => { /* ... */ };
// const gitignorePatterns = readGitignore();

export default tseslint.config(
  // Use tseslint.config for easier setup
  // 1. Global Ignores
  {
    ignores: [
      '**/node_modules/', // More robust ignore for node_modules in subdirectories
      '**/dist/',
      '**/build/',
      '**/coverage/',
      '*.log',
      'logs/',
      '.env',
      '*.env',
      '.env.*',
      // ...gitignorePatterns, // If you implement readGitignore
      'ecosystem.config.cjs', // Usually plain JS, does not need TS linting
      'entrypoint.sh',
      '.dockerignore',
      // Files that are definitely not part of type-checked projects:
      'client/src/vite-env.d.ts', // Often just ambient, not part of active compilation for linting
    ],
  },

  // 2. Base ESLint recommended rules for all JS/TS files initially
  pluginJs.configs.recommended,

  // 3. Base TypeScript configuration (NON-TYPE-AWARE) for all .ts/.tsx files
  // This provides general TS syntax linting without the overhead of type checking yet.
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended, // Use the non-type-aware recommended set first
    ],
    rules: {
      // You can turn off rules here if needed, e.g.:
      // '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // 4. API specific configurations (TYPE-AWARE)
  {
    files: ['api/src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked, // Layer type-aware rules here
    ],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: ['./api/tsconfig.json'], // Specific tsconfig for these files
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // API specific TS rules, or overrides for recommendedTypeChecked
    },
  },

  // 5. Client specific configurations (TYPE-AWARE for React/TSX)
  {
    files: ['client/src/**/*.{ts,tsx}'],
    // Start with React recommended, then layer TS type-aware
    ...pluginReactConfig, // Base React config (includes parser, plugins for React)
    extends: [
      ...tseslint.configs.recommendedTypeChecked, // Add type-aware TS rules
    ],
    languageOptions: {
      // pluginReactConfig might set some languageOptions, merge carefully
      // If pluginReactConfig.languageOptions exists: ...pluginReactConfig.languageOptions,
      globals: { ...globals.browser },
      parserOptions: {
        project: ['./client/tsconfig.json'], // Specific tsconfig for these files
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true }, // Ensure JSX is enabled
      },
    },
    settings: {
      // React settings usually go here
      react: {
        version: 'detect',
      },
    },
    plugins: {
      // Explicitly list plugins for clarity or if not fully spread by pluginReactConfig
      // 'react' plugin is often part of pluginReactConfig.plugins.react
      'react-hooks': pluginReactHooks,
    },
    rules: {
      // Start with rules from plugins if they are not automatically included by extends
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // If using new JSX transform
      'react/prop-types': 'off', // Using TypeScript
      // Client specific TS rules, or overrides for recommendedTypeChecked
    },
  },

  // 6. Client VITE config file (TYPE-AWARE, if needed, using tsconfig.node.json)
  // Ensure client/tsconfig.node.json exists and includes vite.config.ts
  {
    files: ['client/vite.config.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.node }, // Vite config runs in Node
      parserOptions: {
        project: ['./client/tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 7. Prettier configuration (MUST BE LAST in terms of rule overrides for styling)
  {
    // Apply to all files Prettier should format that ESLint also processes
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...prettierConfig.rules, // From eslint-config-prettier
      'prettier/prettier': 'warn', // Rule from eslint-plugin-prettier
    },
  }
);
