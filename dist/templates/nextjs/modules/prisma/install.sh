#!/bin/bash

# Install Prisma
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init --datasource-provider postgresql

echo "Prisma installed"
