import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// Use the pre-installed Chromium when present (CI containers), otherwise Playwright's own.
const localChromium = "/opt/pw-browsers/chromium";
const executablePath = fs.existsSync(localChromium) ? localChromium : undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", trace: "off" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start -- -p 3100", port: 3100, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { executablePath } } },
  ],
});
