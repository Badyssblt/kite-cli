#!/bin/bash

# shadcn requires Tailwind, check if installed
if [ ! -f "tailwind.config.js" ] && [ ! -f "tailwind.config.ts" ]; then
  echo "Installing Tailwind CSS first..."
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
fi

# Initialize shadcn with defaults
npx shadcn@latest init -d

echo "✓ shadcn/ui installed"
echo "  Add components with: npx shadcn@latest add button"
