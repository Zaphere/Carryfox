import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "postgresql://carryfox:Password123321@localhost:5432/future_freight";

if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Relative glob (forward slashes) — drizzle-kit resolves it against this
  // config's directory. Absolute Windows paths with backslashes break its
  // glob matcher ("No schema files found").
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
