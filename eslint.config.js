import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "*.d.ts",
      "*.tsbuildinfo",
      "vite.config.js",
      "vite.config.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{ts,js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "no-console": "off"
    }
  }
);
