import Database from 'better-sqlite3'
import { PrismaBetterSQLite } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '~~/prisma/generated/client'

const client = new Database('./prisma/dev.db')
const adapter = new PrismaBetterSQLite(client)

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
