import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
   {
      ignores: [".vite/**", "coverage/**", "dist/**", "node_modules/**"]
   },
   js.configs.recommended,
   {
      files: ["**/*.{js,jsx}"],
      languageOptions: {
         ecmaVersion: "latest",
         globals: {
            ...globals.browser,
            ...globals.es2024
         },
         parserOptions: {
            ecmaFeatures: {
               jsx: true
            }
         },
         sourceType: "module"
      },
      plugins: {
         "react-hooks": reactHooks,
         "react-refresh": reactRefresh
      },
      rules: {
         ...reactHooks.configs.recommended.rules,
         "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
         "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
      }
   },
   {
      files: ["*.config.js", "vite.config.js"],
      languageOptions: {
         globals: {
            ...globals.node
         }
      }
   }
];
