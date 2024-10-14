import { PrismaClient } from "@prisma/client";

if (!globalThis.prisma)
    globalThis.prisma = new PrismaClient();

export const prisma = globalThis.prisma as PrismaClient;

