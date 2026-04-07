import tseslint from "@electron-toolkit/eslint-config-ts";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
export default tseslint.config(
  { ignores: ["**/node_modules", "**/dist", "**/out", "**/public", "src/renderer/src/lib/omnibox-new/bangs.ts"] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{ts,tsx}"],
    ...eslintPluginReactHooks.configs.flat.recommended,
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off"
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...reactRefresh.configs.vite()
  },
  {
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "react-refresh/only-export-components": "off"
    }
  }
);
