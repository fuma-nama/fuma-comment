import { exec } from "node:child_process";
import * as util from "node:util";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

const execPromisify = util.promisify(exec);

const tables = Prisma.dmmf.datamodel.models
	.map((model) => model.dbName)
	.filter((table) => table);

async function clearMysql(prisma: PrismaClient): Promise<void> {
	await prisma.$transaction([
		prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`,
		...tables.map((table) => prisma.$executeRawUnsafe(`TRUNCATE ${table};`)),
		prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`,
	]);
}

async function clearPostgres(prisma: PrismaClient): Promise<void> {
	await prisma.$transaction([
		...tables.map((table) =>
			prisma.$executeRawUnsafe(`TRUNCATE ${table} CASCADE;`),
		),
	]);
}

async function clearDefault(): Promise<void> {
	await execPromisify("pnpm prisma migrate reset --force --skip-seed");
}

export async function init(): Promise<void> {
	await execPromisify("pnpm prisma db push --force-reset --skip-generate");
}

export async function clear(
	prisma: PrismaClient,
	provider: "postgres" | "mysql" = "postgres",
): Promise<void> {
	const executeClear = {
		mysql: clearMysql,
		postgres: clearPostgres,
	};

	if (provider in executeClear) {
		await executeClear[provider](prisma);
	} else {
		await clearDefault();
	}
}
