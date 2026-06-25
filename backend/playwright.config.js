// @ts-check
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  timeout: 30000,

  fullyParallel: false,

  workers: 1,

  retries: 0,

  reporter: "html",

  use: {
    baseURL: "http://localhost:5000",
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  },
});