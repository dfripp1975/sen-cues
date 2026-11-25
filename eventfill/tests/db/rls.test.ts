import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

// Runs only when TEST_DATABASE_URL is set (see scripts/test-db.sh).
const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

d("row-level security / tenant isolation", () => {
  const db = new Client({ connectionString: url });
  let orgA = "";
  let orgB = "";
  let eventB = "";

  async function as<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
    await db.query("begin");
    try {
      await db.query(`set local role ${user ? "authenticated" : "anon"}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
      const r = await fn();
      await db.query("commit");
      return r;
    } catch (e) {
      await db.query("rollback");
      throw e;
    }
  }

  beforeAll(async () => {
    await db.connect();
    await db.query("insert into auth.users(id, email) values ($1,'a@example.com'),($2,'b@example.com')", [A, B]);
    orgA = await as(A, async () => (await db.query("select public.create_organisation('Org A') id")).rows[0].id);
    orgB = await as(B, async () => (await db.query("select public.create_organisation('Org B') id")).rows[0].id);
    eventB = await as(B, async () =>
      (await db.query("insert into events(org_id,name,event_date,ticket_target) values ($1,'B secret gala','2030-01-01',100) returning id", [orgB])).rows[0].id,
    );
    await as(B, () => db.query("insert into ticket_sales(org_id,event_id,sale_date,quantity,revenue) values ($1,$2,'2029-12-01',10,100)", [orgB, eventB]));
  });

  afterAll(async () => {
    await db.end();
  });

  it("new organisations get an owner membership and a free subscription", async () => {
    const r = await as(A, () => db.query("select role from organisation_members where org_id=$1", [orgA]));
    expect(r.rows).toEqual([{ role: "owner" }]);
    const s = await as(A, () => db.query("select plan from subscriptions where org_id=$1", [orgA]));
    expect(s.rows[0].plan).toBe("free");
  });

  it("a user cannot read another organisation's events or sales", async () => {
    const ev = await as(A, () => db.query("select * from events"));
    expect(ev.rows).toHaveLength(0);
    const sales = await as(A, () => db.query("select * from ticket_sales"));
    expect(sales.rows).toHaveLength(0);
    const orgs = await as(A, () => db.query("select name from organisations"));
    expect(orgs.rows.map((o) => o.name)).toEqual(["Org A"]);
  });

  it("a user cannot insert rows into another organisation", async () => {
    await expect(
      as(A, () => db.query("insert into events(org_id,name,event_date) values ($1,'hijack','2030-01-01')", [orgB])),
    ).rejects.toThrow(/row-level security/);
  });

  it("a user cannot attach rows in their own org to another org's event", async () => {
    await expect(
      as(A, () => db.query("insert into ticket_sales(org_id,event_id,sale_date,quantity) values ($1,$2,'2030-01-01',5)", [orgA, eventB])),
    ).rejects.toThrow(/does not belong/);
  });

  it("a user cannot update or delete another organisation's rows", async () => {
    const u = await as(A, () => db.query("update events set name='pwned' where id=$1", [eventB]));
    expect(u.rowCount).toBe(0);
    const del = await as(A, () => db.query("delete from events where id=$1", [eventB]));
    expect(del.rowCount).toBe(0);
    const still = await as(B, () => db.query("select name from events where id=$1", [eventB]));
    expect(still.rows[0].name).toBe("B secret gala");
  });

  it("users cannot change their own subscription plan", async () => {
    const u = await as(A, () => db.query("update subscriptions set plan='pro' where org_id=$1", [orgA]));
    expect(u.rowCount).toBe(0);
    await expect(as(A, () => db.query("insert into subscriptions(org_id,plan) values ($1,'pro')", [orgA]))).rejects.toThrow();
  });

  it("users cannot add themselves to another organisation", async () => {
    await expect(
      as(A, () => db.query("insert into organisation_members(org_id,user_id,role) values ($1,$2,'owner')", [orgB, A])),
    ).rejects.toThrow(/row-level security/);
  });

  it("anonymous visitors see nothing", async () => {
    const ev = await as(null, () => db.query("select * from events"));
    expect(ev.rows).toHaveLength(0);
    const subs = await as(null, () => db.query("select * from subscriptions"));
    expect(subs.rows).toHaveLength(0);
  });

  it("team members of the same org can see shared data", async () => {
    const C = "00000000-0000-0000-0000-00000000000c";
    await db.query("insert into auth.users(id, email) values ($1,'c@example.com')", [C]);
    const token = await as(B, async () =>
      (await db.query("insert into organisation_invites(org_id,email) values ($1,'c@example.com') returning token", [orgB])).rows[0].token,
    );
    await as(C, () => db.query("select public.accept_invite($1)", [token]));
    const ev = await as(C, () => db.query("select name from events"));
    expect(ev.rows.map((e) => e.name)).toEqual(["B secret gala"]);
  });

  it("invites cannot be accepted by a different email address", async () => {
    const token = await as(B, async () =>
      (await db.query("insert into organisation_invites(org_id,email) values ($1,'someone@example.com') returning token", [orgB])).rows[0].token,
    );
    await expect(as(A, () => db.query("select public.accept_invite($1)", [token]))).rejects.toThrow(/different email/);
  });

  it("members can post notifications only to their own organisation", async () => {
    await as(A, () => db.query("insert into notifications(org_id,title) values ($1,'ok')", [orgA]));
    await expect(as(A, () => db.query("insert into notifications(org_id,title) values ($1,'spoof')", [orgB]))).rejects.toThrow(/row-level security/);
  });

  it("team members can see each other's names but not other orgs' profiles", async () => {
    const r = await as(B, () => db.query("select id from profiles"));
    expect(r.rows.map((x) => x.id).sort()).toEqual([B, "00000000-0000-0000-0000-00000000000c"].sort());
  });

  it("series are private to their organisation and can't be borrowed", async () => {
    const seriesB = await as(B, async () => (await db.query("insert into event_series(org_id,name,recurrence) values ($1,'B weekly','weekly') returning id", [orgB])).rows[0].id);
    const seen = await as(A, () => db.query("select * from event_series"));
    expect(seen.rows).toHaveLength(0);
    await expect(
      as(A, () => db.query("insert into events(org_id,name,event_date,series_id) values ($1,'sneaky','2030-01-01',$2)", [orgA, seriesB])),
    ).rejects.toThrow(/series does not belong/);
    await as(B, () => db.query("insert into events(org_id,name,event_date,series_id) values ($1,'B week 1','2030-01-01',$2)", [orgB, seriesB]));
  });

  it("multi-day events can't end before they start", async () => {
    await expect(
      as(A, () => db.query("insert into events(org_id,name,event_date,end_date) values ($1,'backwards','2030-01-05','2030-01-01')", [orgA])),
    ).rejects.toThrow(/events_end_after_start/);
  });

  it("the rate limiter is not callable by end users", async () => {
    await expect(as(A, () => db.query("select public.rate_limit_hit('x', 60, 5)"))).rejects.toThrow(/permission denied/);
  });
});
