import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

declare global {
  var __db: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

export const db = globalThis.__db ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

