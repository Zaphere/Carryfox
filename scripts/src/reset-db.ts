/**
 * Wipe operational data so the app can be tested from a clean slate.
 *
 *   pnpm --filter @workspace/scripts run db:reset            # wipe operational tables
 *   pnpm --filter @workspace/scripts run db:reset -- --all   # also wipe the services catalog
 *
 * Wiped (with identity sequences restarted, so IDs start at 1 again):
 *   bookings, quotes, drivers, vehicles, whatsapp_conversations, whatsapp_messages
 *
 * The `services` catalog is KEPT by default — it is content the public
 * Services page and the quote calculator depend on, not test data. Pass
 * --all to wipe it too (it can only be re-added manually or by re-seeding).
 *
 * Reads DATABASE_URL from the environment, or from the repo-root .env file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OPERATIONAL_TABLES = [
  "bookings",
  "quotes",
  "drivers",
  "vehicles",
  "whatsapp_messages",
  "whatsapp_conversations",
];
const CATALOG_TABLES = ["services"];

function loadDotEnv(): void {
  if (process.env.DATABASE_URL) return;
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set (env var or repo-root .env file).");
  }

  const wipeCatalog = process.argv.includes("--all");
  const tables = wipeCatalog ? [...OPERATIONAL_TABLES, ...CATALOG_TABLES] : OPERATIONAL_TABLES;

  const { pool } = await import("@workspace/db");
  try {
    const counts = new Map<string, number>();
    for (const table of ["bookings", "quotes", "drivers", "vehicles", "whatsapp_messages", "whatsapp_conversations", "services"]) {
      // Table name comes from the fixed lists above, not user input.
      const res = await pool.query<{ n: string }>(`SELECT count(*) AS n FROM "${table}"`);
      counts.set(table, Number(res.rows[0].n));
    }

    // Quote identifiers — table names come from the fixed lists above, not user input.
    const list = tables.map((t) => `"${t}"`).join(", ");
    await pool.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

    console.log("Wiped tables:");
    for (const table of tables) {
      console.log(`  ${table}: ${counts.get(table) ?? 0} rows removed`);
    }
    if (!wipeCatalog) {
      console.log(`  (kept: ${CATALOG_TABLES.join(", ")} — pass --all to wipe the catalog too)`);
    }
    console.log("Done. ID sequences restart at 1.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
