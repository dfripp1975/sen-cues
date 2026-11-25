// FICTIONAL demonstration data for the public demo at /demo.
// Every organisation, event, figure and response here is invented and is
// labelled "Demo data" wherever it is shown. Dates are relative to today so the
// demo always looks current. Generation is deterministic.
import { addDays, daysBetween, today } from "./dates";
import { addMonthsClamped } from "./series";
import type { CampaignRow, EventRow, LinkRow, MoneyRow, RescueActionRow, SaleRecord, SeriesRow, TaskRow, TierRow } from "@/types/db";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildDemo(asOf = today()) {
  const created = `${addDays(asOf, -60)}T09:00:00Z`;
  const ev = (id: string, o: Partial<EventRow>): EventRow => ({
    id,
    org_id: "demo-org",
    name: "",
    description: null,
    category: "other",
    venue: null,
    is_online: false,
    event_date: asOf,
    end_date: null,
    series_id: null,
    start_time: "18:30:00",
    end_time: "21:00:00",
    timezone: "Europe/London",
    ticketing_platform: "Eventbrite",
    booking_url: "https://example.com/book",
    capacity: null,
    ticket_target: 100,
    marketing_budget: 0,
    image_url: null,
    notes: null,
    sales_start_date: null,
    attendance: null,
    lessons_learned: null,
    status: "active",
    is_template: false,
    created_at: created,
    updated_at: created,
    ...o,
  });

  const events: EventRow[] = [
    ev("demo-1", {
      name: "Harbourside Founders Mixer",
      category: "networking",
      venue: "The Old Customs House, Bristol (fictional)",
      event_date: addDays(asOf, 12),
      ticket_target: 150,
      capacity: 180,
      marketing_budget: 400,
      sales_start_date: addDays(asOf, -40),
      description: "An evening of informal networking for early-stage founders.",
      booking_url: null,
    }),
    ev("demo-2", {
      name: "Practical AI for Small Teams Workshop",
      category: "workshop",
      venue: "Online",
      is_online: true,
      event_date: addDays(asOf, 26),
      ticket_target: 60,
      capacity: 80,
      marketing_budget: 250,
      sales_start_date: addDays(asOf, -30),
      description:
        "A hands-on, three-hour workshop for small business teams who want to use AI tools responsibly in day-to-day work. Attendees will leave with a simple written plan, a set of tested prompts for common tasks, and a checklist for reviewing AI output before it reaches customers. Suitable for beginners; no technical background required.",
    }),
    ev("demo-3", {
      name: "Riverside Charity Music Weekend",
      category: "festival",
      end_date: addDays(asOf, 46),
      venue: "Riverside Hall, Leeds (fictional)",
      event_date: addDays(asOf, 45),
      ticket_target: 300,
      capacity: 350,
      marketing_budget: 600,
      sales_start_date: addDays(asOf, -21),
      description: "Local bands raising money for a (fictional) community food project.",
    }),
    ev("demo-4", {
      name: "Spring Makers Market",
      category: "exhibition",
      venue: "Corn Exchange, Norwich (fictional)",
      event_date: addDays(asOf, -18),
      ticket_target: 400,
      capacity: 500,
      marketing_budget: 500,
      sales_start_date: addDays(asOf, -75),
      status: "completed",
      attendance: 371,
      lessons_learned: "Partner shares drove most link clicks. Start exhibitor promotion earlier next time.",
    }),
    ...[-1, 0, 1, 2].map((m) => daysBetween(asOf, addMonthsClamped(addDays(asOf, 10), m))).map((offset, i) =>
      ev(`demo-s${i + 1}`, {
        name: "Founders Breakfast Club",
        category: "networking",
        series_id: "demo-series-1",
        venue: "The Corner Café, Bristol (fictional)",
        event_date: addDays(asOf, offset),
        start_time: "07:45:00",
        end_time: "09:00:00",
        ticket_target: 40,
        capacity: 45,
        sales_start_date: addDays(asOf, offset - 21),
        status: offset < 0 ? "completed" : "active",
        attendance: offset < 0 ? 36 : null,
        description: "A monthly early-morning breakfast for local founders: short introductions, one guest speaker, coffee.",
      }),
    ),
  ];
  const series: SeriesRow[] = [{ id: "demo-series-1", org_id: "demo-org", name: "Founders Breakfast Club", recurrence: "monthly", created_at: created }];

  const tiers: TierRow[] = [
    { id: "t1", event_id: "demo-1", name: "General", price: 15, quantity: 160 },
    { id: "t2", event_id: "demo-1", name: "Supporter", price: 25, quantity: 20 },
    { id: "t3", event_id: "demo-2", name: "Standard", price: 49, quantity: 70 },
    { id: "t4", event_id: "demo-2", name: "Team of 3", price: 129, quantity: 10 },
    { id: "t5", event_id: "demo-3", name: "Adult", price: 18, quantity: 300 },
    { id: "t6", event_id: "demo-3", name: "Concession", price: 10, quantity: 50 },
    { id: "t7", event_id: "demo-4", name: "Entry", price: 5, quantity: 500 },
    ...[1, 2, 3, 4].map((i) => ({ id: `ts${i}`, event_id: `demo-s${i}`, name: "Breakfast ticket", price: 12, quantity: 45 })),
  ];

  const rand = seeded(42);
  const sales: SaleRecord[] = [];
  let n = 0;
  const gen = (eventId: string, start: string, end: string, base: number, growth: number, price: number) => {
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
    for (let i = 0; i <= days; i++) {
      const d = addDays(start, i);
      const q = Math.max(0, Math.round(base + growth * i + (rand() - 0.5) * base * 1.4));
      if (q === 0) continue;
      const refunds = rand() < 0.05 ? 1 : 0;
      sales.push({
        id: `s${++n}`,
        event_id: eventId,
        tier_id: null,
        sale_date: d,
        quantity: q,
        revenue: q * price,
        refunds,
        refund_amount: refunds * price,
        source: i % 9 === 0 ? "csv" : "manual",
        note: null,
        created_at: `${d}T18:00:00Z`,
      });
    }
  };
  gen("demo-1", addDays(asOf, -40), addDays(asOf, -1), 1.6, 0.01, 15); // behind
  gen("demo-2", addDays(asOf, -30), addDays(asOf, -1), 1.2, 0.03, 49); // on track
  gen("demo-3", addDays(asOf, -21), addDays(asOf, -1), 2.5, 0.12, 18); // behind
  gen("demo-4", addDays(asOf, -75), addDays(asOf, -19), 4, 0.06, 5); // finished
  const pastBreakfast = daysBetween(asOf, addMonthsClamped(addDays(asOf, 10), -1));
  gen("demo-s1", addDays(asOf, pastBreakfast - 21), addDays(asOf, pastBreakfast - 1), 1.7, 0.06, 12); // past breakfast
  gen("demo-s2", addDays(asOf, -11), addDays(asOf, -1), 1.8, 0.1, 12); // next breakfast

  const campaigns: CampaignRow[] = [
    { id: "c1", event_id: "demo-1", name: "LinkedIn founder outreach", channel: "linkedin", status: "active", start_date: addDays(asOf, -30), end_date: addDays(asOf, 12), budget: 150, notes: null },
    { id: "c2", event_id: "demo-1", name: "Newsletter to past attendees", channel: "email", status: "planned", start_date: addDays(asOf, 1), end_date: addDays(asOf, 10), budget: 0, notes: null },
    { id: "c3", event_id: "demo-3", name: "Band cross-promotion", channel: "partnership", status: "active", start_date: addDays(asOf, -14), end_date: addDays(asOf, 45), budget: 0, notes: null },
    { id: "c4", event_id: "demo-2", name: "Instagram tips series", channel: "instagram", status: "active", start_date: addDays(asOf, -20), end_date: addDays(asOf, 25), budget: 80, notes: null },
  ];

  const tasks: TaskRow[] = [
    { id: "k1", event_id: "demo-1", campaign_id: "c1", title: "Post speaker line-up on LinkedIn", channel: "linkedin", due_date: addDays(asOf, 1), status: "todo", assignee_id: null },
    { id: "k2", event_id: "demo-1", campaign_id: "c2", title: "Draft newsletter to opted-in past attendees", channel: "email", due_date: addDays(asOf, 2), status: "in_progress", assignee_id: null },
    { id: "k3", event_id: "demo-3", campaign_id: "c3", title: "Send bands their tracking links", channel: "partnership", due_date: addDays(asOf, 3), status: "todo", assignee_id: null },
    { id: "k4", event_id: "demo-2", campaign_id: "c4", title: "Record 30-second tip video", channel: "instagram", due_date: addDays(asOf, 5), status: "todo", assignee_id: null },
    { id: "k5", event_id: "demo-1", campaign_id: null, title: "Confirm venue AV", channel: null, due_date: addDays(asOf, -2), status: "done", assignee_id: null },
  ];

  const rescueActions: RescueActionRow[] = [
    { id: "r1", event_id: "demo-1", recommendation_key: "cta", title: "Add a booking link everywhere", description: null, assignee_id: null, due_date: addDays(asOf, 1), status: "in_progress", tickets_at_creation: 52, completed_at: null, created_at: `${addDays(asOf, -3)}T10:00:00Z` },
    { id: "r2", event_id: "demo-1", recommendation_key: "partnerships", title: "Start a community partnership campaign", description: null, assignee_id: null, due_date: addDays(asOf, 4), status: "todo", tickets_at_creation: 52, completed_at: null, created_at: `${addDays(asOf, -3)}T10:00:00Z` },
  ];

  const links: LinkRow[] = [
    { id: "l1", event_id: "demo-1", campaign_id: "c1", slug: "demo-li", label: "LinkedIn posts", destination_url: "https://example.com/book", utm_source: "linkedin", utm_medium: "social", utm_campaign: "founders-mixer", utm_content: null, is_active: true, created_at: created },
    { id: "l2", event_id: "demo-1", campaign_id: "c2", slug: "demo-em", label: "Newsletter", destination_url: "https://example.com/book", utm_source: "newsletter", utm_medium: "email", utm_campaign: "founders-mixer", utm_content: null, is_active: true, created_at: created },
    { id: "l3", event_id: "demo-3", campaign_id: "c3", slug: "demo-band", label: "Band shares", destination_url: "https://example.com/gig", utm_source: "partners", utm_medium: "referral", utm_campaign: "summer-gig", utm_content: null, is_active: true, created_at: created },
    { id: "l4", event_id: "demo-2", campaign_id: "c4", slug: "demo-ig", label: "Instagram bio", destination_url: "https://example.com/ai", utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-workshop", utm_content: null, is_active: true, created_at: created },
  ];
  const clicks: { link_id: string; clicked_at: string; device: string; referrer_host: string | null }[] = [];
  const clickRate: Record<string, number> = { l1: 9, l2: 1, l3: 14, l4: 6 };
  for (const l of links) {
    for (let i = 0; i < 21; i++) {
      const c = Math.round(clickRate[l.id] * (0.5 + rand()));
      for (let j = 0; j < c; j++) clicks.push({ link_id: l.id, clicked_at: `${addDays(asOf, -i)}T12:00:00Z`, device: rand() < 0.65 ? "mobile" : "desktop", referrer_host: null });
    }
  }

  const income: MoneyRow[] = [
    { id: "i1", event_id: "demo-1", category: "sponsorship", description: "Co-working space sponsor (fictional)", amount: 750, is_estimate: false },
    { id: "i2", event_id: "demo-3", category: "other", description: "Bar share (estimate)", amount: 900, is_estimate: true },
  ];
  const expenses: MoneyRow[] = [
    { id: "e1", event_id: "demo-1", category: "venue", description: "Venue hire", amount: 1200, is_estimate: false },
    { id: "e2", event_id: "demo-1", category: "catering", description: "Drinks and canapés", amount: 950, is_estimate: true },
    { id: "e3", event_id: "demo-1", category: "marketing", description: "LinkedIn ads", amount: 150, is_estimate: false },
    { id: "e4", event_id: "demo-1", category: "ticketing_fees", description: "Platform fees", amount: 120, is_estimate: true },
    { id: "e5", event_id: "demo-3", category: "venue", description: "Hall hire", amount: 1400, is_estimate: false },
    { id: "e6", event_id: "demo-3", category: "equipment", description: "PA and lighting", amount: 650, is_estimate: true },
  ];

  return {
    org: { name: "Northlight Events (fictional)", currency: "GBP" },
    events,
    series,
    tiers,
    sales,
    campaigns,
    tasks,
    rescueActions,
    links,
    clicks,
    income,
    expenses,
  };
}

export type DemoData = ReturnType<typeof buildDemo>;
