import { test, expect } from "@playwright/test";

const MARKETING = ["/", "/features", "/how-it-works", "/pricing", "/about", "/contact", "/help", "/privacy", "/terms", "/cookies", "/login", "/register", "/forgot-password"];

test.describe("marketing site", () => {
  for (const path of MARKETING) {
    test(`${path} renders with one h1 and no horizontal overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow).toBe(false);
      expect(errors).toEqual([]);
    });
  }

  test("homepage shows the headline and both calls to action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Stop guessing.");
    await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore demo/i }).first()).toBeVisible();
    await expect(page.getByText("Demo data from a fictional organiser").first()).toBeVisible();
  });

  test("homepage does not contain invented testimonials or customer counts", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const banned of ["testimonial", "trusted by", "customers love", "5 stars", "★★★★★"]) expect(text).not.toContain(banned);
  });

  test("pricing toggle switches to annual prices", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("$29").first()).toBeVisible();
    await page.getByRole("radio", { name: /Annual/ }).click();
    await expect(page.getByText("Billed $290 yearly")).toBeVisible();
  });

  test("UK visitors see pounds and can switch currency", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "GB" });
    await page.goto("/pricing");
    const picker = page.getByLabel("Prices for");
    await expect(picker).toHaveValue("GBP");
    await expect(page.getByText("£25").first()).toBeVisible();
    await expect(page.getByText(/Bacs Direct Debit/)).toBeVisible();
    await picker.selectOption("EUR");
    await expect(page.getByText("€29").first()).toBeVisible();
    await expect(page.getByText(/SEPA Direct Debit/)).toBeVisible();
    // The choice is remembered on the next page load.
    await page.reload();
    await expect(page.getByLabel("Prices for")).toHaveValue("EUR");
    await expect(page.getByRole("link", { name: "Choose Growth" })).toHaveAttribute("href", /currency=EUR/);
  });

  test("Start Free leads to registration", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Start free/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByText(/At least 10 characters/)).toBeVisible();
  });

  test("cookie preferences can be saved", async ({ page }) => {
    await page.goto("/cookies");
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Cookie preferences saved")).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "ef_cookie_prefs")).toBeTruthy();
  });
});

test.describe("navigation", () => {
  test("desktop or mobile nav reaches features and pricing", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: isMobile ? "Mobile" : "Main" }).getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Plans");
  });

  test("footer legal links work", async ({ page }) => {
    for (const [name, path] of [["Privacy Policy", "/privacy"], ["Terms and Conditions", "/terms"], ["Cookie Preferences", "/cookies"]]) {
      await page.goto("/about");
      await page.getByRole("contentinfo").getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(path));
    }
  });

  test("unknown pages show a 404", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});

test.describe("demo", () => {
  test("overview shows clearly labelled fictional data", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText(/every organisation, event and number here is fictional/).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText("Demo data").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Harbourside Founders Mixer" })).toBeVisible();
  });

  test("Event Rescue shows a per-day target and recommendations", async ({ page }) => {
    await page.goto("/demo/events/demo-1/rescue");
    await expect(page.getByText("Event Rescue Mode").first()).toBeVisible();
    await expect(page.getByText(/You need to sell an average of [\d.]+ tickets per day/)).toBeVisible();
    await expect(page.getByText("Recommended actions")).toBeVisible();
    await expect(page.getByText(/results aren.t guaranteed/)).toBeVisible();
  });

  test("forecast is labelled as an estimate and explains the maths", async ({ page }) => {
    await page.goto("/demo/events/demo-2/forecast");
    await expect(page.getByText("These are estimates, not predictions of certainty")).toBeVisible();
    await expect(page.getByText("How this forecast is calculated")).toBeVisible();
  });

  test("event tabs all load", async ({ page }) => {
    for (const tab of ["", "/sales", "/forecast", "/rescue", "/finance", "/report"]) {
      const res = await page.goto(`/demo/events/demo-1${tab}`);
      expect(res?.status()).toBe(200);
    }
  });

  test("filters update the overview", async ({ page }) => {
    await page.goto("/demo");
    await page.getByLabel("Date range").selectOption("all");
    await expect(page).toHaveURL(/range=all/);
  });

  test("sections outside the demo explain how to get access", async ({ page }) => {
    await page.goto("/demo/campaigns");
    await expect(page.getByRole("heading", { name: /isn.t part of the demo/ })).toBeVisible();
    await page.goto("/demo/events/new");
    await expect(page.getByRole("link", { name: "Create free account" }).first()).toBeVisible();
  });

  test("a recurring series appears once in the events list and has its own page", async ({ page }) => {
    await page.goto("/demo/events");
    await expect(page.getByRole("link", { name: "Founders Breakfast Club", exact: true })).toHaveCount(1);
    await page.getByRole("link", { name: /upcoming dates · view series/ }).click();
    await expect(page).toHaveURL(/\/demo\/series\/demo-series-1/);
    await expect(page.getByText("Recurring series")).toBeVisible();
    await expect(page.getByText(/counts as one active event/)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(4);
  });

  test("showing all events lists every date of the series", async ({ page }) => {
    await page.goto("/demo/events?status=active");
    await expect(page.getByRole("link", { name: "Founders Breakfast Club", exact: true })).toHaveCount(3);
  });

  test("multi-day events show a date range", async ({ page }) => {
    await page.goto("/demo/events/demo-3");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Riverside Charity Music Weekend");
    await expect(page.getByText(/\w{3} \d+ – \w{3} \d+ \w{3} \d{4}/).first()).toBeVisible();
    await expect(page.getByText("Days until last day")).toBeVisible();
  });

  test("unknown demo events 404", async ({ page }) => {
    const res = await page.goto("/demo/events/nope");
    expect(res?.status()).toBe(404);
  });
});

test.describe("access control", () => {
  for (const path of ["/dashboard", "/dashboard/events", "/dashboard/settings/billing", "/onboarding", "/admin"]) {
    test(`${path} is not reachable while signed out`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/(login|setup-required)/);
    });
  }

  test("data export requires sign-in", async ({ request }) => {
    const res = await request.get("/dashboard/settings/privacy/export", { maxRedirects: 0 });
    expect([302, 307, 401]).toContain(res.status());
  });
});

test.describe("public endpoints", () => {
  test("Stripe webhook rejects unsigned requests", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", { data: { type: "customer.subscription.updated" } });
    expect(res.status()).toBe(400);
  });

  test("retention job requires the cron secret", async ({ request }) => {
    const res = await request.get("/api/cron/retention");
    expect(res.status()).toBe(401);
  });

  test("tracking links reject malformed slugs and unknown links", async ({ request }) => {
    for (const slug of ["..%2F..%2Fetc", "UPPER", "a", "nope-not-real"]) {
      const res = await request.get(`/l/${slug}`, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
    }
  });

  test("security headers are set", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });
});
