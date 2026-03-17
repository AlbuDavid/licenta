import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
  return new PrismaClient({ adapter });
}

// Definim tipul pentru variabila globală, ca să nu se plângă TypeScript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Folosim instanța existentă sau creăm una nouă
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Salvăm instanța în globalThis doar dacă nu suntem în producție
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}