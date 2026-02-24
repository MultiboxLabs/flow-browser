import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/main/saving/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite"
});
