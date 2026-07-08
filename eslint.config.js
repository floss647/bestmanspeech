import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Build output, Deno edge functions (own runtime + globals), and the
    // auto-generated Supabase types are not part of the browser app lint.
    ignores: ["dist", "supabase/functions/**", "src/integrations/supabase/types.ts"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Flag unused vars and stray `any`s as warnings so they surface in
      // review without blocking CI on the existing backlog.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      // shadcn/ui generates empty interfaces that extend their base props.
      "@typescript-eslint/no-empty-object-type": "off",
      // Empty catch is used deliberately for optional localStorage access.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    // Tailwind config runs in Node and legitimately uses require().
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
