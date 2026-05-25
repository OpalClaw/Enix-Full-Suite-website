import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 10_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Tests that touch the DB should be tagged with `@integration` and
    // only run when DATABASE_URL is set.
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    // Vitest can't resolve `.js` extensions on `.ts` files like tsx can.
    extensions: [".ts", ".js"],
  },
});
