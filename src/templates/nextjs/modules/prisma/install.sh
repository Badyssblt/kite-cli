#!/bin/bash

# Install Prisma
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma with PostgreSQL by default
npx prisma init --datasource-provider postgresql

# Create lib/db.ts for Prisma client
mkdir -p lib
cat > lib/db.ts << 'EOF'
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
EOF

echo "✓ Prisma installed"
echo "  Next: Edit prisma/schema.prisma and run 'npx prisma db push'"
