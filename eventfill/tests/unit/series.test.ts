import { describe, it, expect } from "vitest";
import { addMonthsClamped, countActiveUnits, generateSeriesDates, nextOccurrence, salesDeadline } from "@/lib/series";
import { formatDateRange } from "@/lib/dates";
import { computeForecast } from "@/lib/forecast";

describe("series dates", () => {
  it("generates weekly and fortnightly dates", () => {
    expect(generateSeriesDates({ start: "2027-01-05", recurrence: "weekly", count: 3 }).map((d) => d.event_date)).toEqual(["2027-01-05", "2027-01-12", "2027-01-19"]);
    expect(generateSeriesDates({ start: "2027-01-05", recurrence: "fortnightly", count: 3 }).map((d) => d.event_date)).toEqual(["2027-01-05", "2027-01-19", "2027-02-02"]);
  });

  it("keeps the same day of month, clamping short months without drifting", () => {
    expect(generateSeriesDates({ start: "2027-01-31", recurrence: "monthly", count: 4 }).map((d) => d.event_date)).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30"]);
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
    expect(nextOccurrence("2027-02-28", "monthly", 31)).toBe("2027-03-31");
  });

  it("preserves event length and sales lead time", () => {
    const d = generateSeriesDates({ start: "2027-03-06", end: "2027-03-07", salesStart: "2027-02-06", recurrence: "monthly", count: 2 });
    expect(d[1]).toEqual({ event_date: "2027-04-06", end_date: "2027-04-07", sales_start_date: "2027-03-09" }); // same 28-day lead
  });

  it("continues a monthly series on its original day of month", () => {
    const more = generateSeriesDates({ start: nextOccurrence("2027-02-28", "monthly", 31), recurrence: "monthly", count: 3, dayOfMonth: 31 });
    expect(more.map((d) => d.event_date)).toEqual(["2027-03-31", "2027-04-30", "2027-05-31"]);
  });

  it("caps the number of dates", () => {
    expect(generateSeriesDates({ start: "2027-01-01", recurrence: "weekly", count: 500 })).toHaveLength(52);
    expect(generateSeriesDates({ start: "2027-01-01", recurrence: "weekly", count: 0 })).toHaveLength(1);
  });
});

describe("plan counting", () => {
  it("counts a series once and ignores templates and archived events", () => {
    const n = countActiveUnits([
      { id: "a", series_id: "s1", status: "active", is_template: false },
      { id: "b", series_id: "s1", status: "active", is_template: false },
      { id: "c", series_id: "s1", status: "draft", is_template: false },
      { id: "d", series_id: null, status: "active", is_template: false },
      { id: "e", series_id: null, status: "archived", is_template: false },
      { id: "f", series_id: null, status: "active", is_template: true },
      { id: "g", series_id: "s2", status: "completed", is_template: false },
    ]);
    expect(n).toBe(2);
  });
});

describe("multi-day events", () => {
  it("tracks sales until the last day", () => {
    expect(salesDeadline({ event_date: "2027-07-01", end_date: "2027-07-03" })).toBe("2027-07-03");
    expect(salesDeadline({ event_date: "2027-07-01", end_date: null })).toBe("2027-07-01");
    const f = computeForecast({ sales: [], target: 100, eventDate: salesDeadline({ event_date: "2027-07-01", end_date: "2027-07-03" }), asOf: "2027-07-02" });
    expect(f.eventPassed).toBe(false);
  });

  it("formats date ranges", () => {
    expect(formatDateRange("2027-07-02", "2027-07-04")).toBe("2 – 4 Jul 2027");
    expect(formatDateRange("2027-06-30", "2027-07-02")).toBe("30 Jun – 2 Jul 2027");
    expect(formatDateRange("2027-12-31", "2028-01-01")).toBe("31 Dec 2027 – 1 Jan 2028");
    expect(formatDateRange("2027-07-02", null)).toBe("2 Jul 2027");
    expect(formatDateRange("2027-01-09", "2027-01-10", { weekday: true })).toBe("Sat 9 – Sun 10 Jan 2027");
    expect(formatDateRange("2027-01-09", null, { weekday: true })).toBe("Sat 9 Jan 2027");
  });
});
