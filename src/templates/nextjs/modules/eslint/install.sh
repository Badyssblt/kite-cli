#!/bin/bash

# Install ESLint for Next.js
npm install -D eslint eslint-config-next @eslint/eslintrc

# Create eslint.config.mjs
cat > eslint.config.mjs << 'EOF'
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
EOF

echo "✓ ESLint installed"
