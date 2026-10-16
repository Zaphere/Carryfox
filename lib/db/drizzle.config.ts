import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Relative glob (forward slashes) — drizzle-kit resolves it against this
  // config's directory. Absolute Windows paths with backslashes break its
  // glob matcher ("No schema files found").
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
