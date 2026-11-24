import { describe, it, expect } from "vitest";
import { validateDestination, buildDestination, generateSlug, isValidSlug, classifyDevice, referrerHost } from "@/lib/tracking";

describe("validateDestination", () => {
  it("accepts normal https URLs", () => {
    expect(validateDestination("https://www.eventbrite.co.uk/e/123").ok).toBe(true);
  });
  it.each([
    ["javascript:alert(1)"],
    ["data:text/html,hi"],
    ["ftp://example.com"],
    ["https://localhost/x"],
    ["http://127.0.0.1/admin"],
    ["http://192.168.1.1"],
    ["http://169.254.169.254/latest/meta-data"],
    ["https://user:pass@example.com"],
    ["not a url"],
    ["https://intranet"],
  ])("rejects %s", (u) => {
    expect(validateDestination(u).ok).toBe(false);
  });
  it("rejects tracking-link loops", () => {
    expect(validateDestination("https://eventfill.app/l/abcd", "eventfill.app").ok).toBe(false);
  });
});

describe("helpers", () => {
  it("adds UTM parameters without dropping existing ones", () => {
    const u = buildDestination("https://example.com/e?aff=1", { utm_source: "instagram", utm_medium: "social", utm_campaign: " spring ", utm_content: "" });
    const p = new URL(u).searchParams;
    expect(p.get("aff")).toBe("1");
    expect(p.get("utm_source")).toBe("instagram");
    expect(p.get("utm_campaign")).toBe("spring");
    expect(p.has("utm_content")).toBe(false);
  });
  it("generates valid unique-looking slugs", () => {
    const s = new Set(Array.from({ length: 200 }, () => generateSlug()));
    expect(s.size).toBe(200);
    for (const slug of s) expect(isValidSlug(slug)).toBe(true);
    expect(isValidSlug("../x")).toBe(false);
  });
  it("classifies devices without storing user agents", () => {
    expect(classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(classifyDevice("facebookexternalhit/1.1")).toBe("bot");
    expect(classifyDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
    expect(classifyDevice(null)).toBe("unknown");
    expect(referrerHost("https://l.instagram.com/?u=abc")).toBe("l.instagram.com");
    expect(referrerHost("garbage")).toBeNull();
  });
});
