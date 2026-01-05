import { PrismaClient } from "@prisma/client";

// Definim tipul pentru variabila globală, ca să nu se plângă TypeScript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Folosim instanța existentă sau creăm una nouă
export const db = globalForPrisma.prisma ?? new PrismaClient();

// Salvăm instanța în globalThis doar dacă nu suntem în producție
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}