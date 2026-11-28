import { test, expect } from "@playwright/test";

// Showcase mode: website and demo only. Run against a build started with
// SHOWCASE_MODE=true, CONTACT_EMAIL and BOOKING_URL set, and E2E_SHOWCASE=1.
test.skip(!process.env.E2E_SHOWCASE, "showcase build only");

const PAGES = ["/", "/features", "/how-it-works", "/pricing", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/demo", "/demo/events/demo-1/rescue"];

test("no page offers sign-up or log-in", async ({ page }) => {
  for (const path of PAGES) {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator('a[href^="/register"], a[href^="/login"]')).toHaveCount(0);
    expect(errors, path).toEqual([]);
  }
});

test("calls to action lead to the contact page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get in touch" }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("link", { name: /@/ })).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByRole("link", { name: "Choose a time" })).toHaveAttribute("href", /^https:\/\//);
});

test("pricing buttons pass the plan to the contact page", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("link", { name: "Ask about Growth" }).click();
  await expect(page).toHaveURL(/\/contact\?plan=growth/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/Growth plan/)).toBeVisible();
});

test("account pages redirect away", async ({ page }) => {
  for (const [from, to] of [["/login", "/contact"], ["/register?plan=pro", "/contact"], ["/dashboard", "/demo"], ["/admin", "/demo"], ["/onboarding", "/contact"]]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
  }
});
