import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '~~/prisma/generated/client'

// Parse DATABASE_URL pour extraire les paramètres de connexion
const url = new URL(process.env.DATABASE_URL!)

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 5
})

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
