import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.sqlite.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: resolve(process.cwd(), "data", "peony_cafe.db"),
  },
});
