import { describe, it, expect } from "vitest";
import { parseSalesCsv, aggregateDaily, csvSafeCell, toCsv, parseDate } from "@/lib/csv";

describe("parseSalesCsv", () => {
  it("parses common headers, currency symbols and UK dates", () => {
    const r = parseSalesCsv("Order Date,Ticket Type,Quantity,Total\n01/03/2026,General,2,£40.00\n2026-03-02,VIP,1,\"1,000\"\n");
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { sale_date: "2026-03-01", tier: "General", quantity: 2, revenue: 40, refunds: 0, refund_amount: 0 },
      { sale_date: "2026-03-02", tier: "VIP", quantity: 1, revenue: 1000, refunds: 0, refund_amount: 0 },
    ]);
  });

  it("reports missing required columns", () => {
    const r = parseSalesCsv("foo,bar\n1,2\n");
    expect(r.rows).toHaveLength(0);
    expect(r.errors.map((e) => e.message).join()).toMatch(/date column/);
  });

  it("rejects bad rows with line numbers but keeps good ones", () => {
    const r = parseSalesCsv("date,quantity,revenue\n2026-02-30,1,5\n2026-03-01,-3,5\n2026-03-01,2.5,5\n2026-03-02,1,abc\n2026-03-03,4,20\n");
    expect(r.rows).toHaveLength(1);
    expect(r.errors.map((e) => e.line)).toEqual([2, 3, 4, 5]);
  });

  it("rejects oversized files", () => {
    const r = parseSalesCsv("date,quantity\n" + "2026-01-01,1\n".repeat(100_000));
    expect(r.errors[0].message).toMatch(/larger than 1 MB/);
  });

  it("strips a UTF-8 BOM", () => {
    expect(parseSalesCsv("﻿date,quantity\n2026-01-01,3\n").rows[0].quantity).toBe(3);
  });
});

describe("helpers", () => {
  it("aggregates per-order rows into daily totals by tier", () => {
    const agg = aggregateDaily([
      { sale_date: "2026-01-01", quantity: 1, revenue: 10, refunds: 0, refund_amount: 0, tier: "A" },
      { sale_date: "2026-01-01", quantity: 2, revenue: 20.1, refunds: 1, refund_amount: 10, tier: "A" },
      { sale_date: "2026-01-01", quantity: 1, revenue: 5, refunds: 0, refund_amount: 0, tier: "B" },
    ]);
    expect(agg).toHaveLength(2);
    expect(agg[0]).toMatchObject({ quantity: 3, revenue: 30.1, refunds: 1 });
  });
  it("neutralises spreadsheet formulas in exports", () => {
    expect(csvSafeCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvSafeCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvSafeCell("plain")).toBe("plain");
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe('a,b\n1,"x,y"');
  });
  it("parses date formats", () => {
    expect(parseDate("2026-03-04T10:00:00Z")).toBe("2026-03-04");
    expect(parseDate("4/3/2026")).toBe("2026-03-04");
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});
