import eslint from "@eslint/js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ["dist", "node_modules"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: projectRoot,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@mui/[^/]+$",
              message:
                "Import from component-specific entry points (e.g. @mui/material/Button) to keep bundles lean.",
            },
          ],
        },
      ],
    },
  },
);
