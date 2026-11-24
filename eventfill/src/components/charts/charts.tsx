"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie } from "recharts";

const BRAND = "#4F46E5";
const TEAL = "#14B8A6";
const GRID = "#E2E8F0";
const AXIS = { fontSize: 11, fill: "#64748B" };

const shortDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const tooltipStyle = { borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 10px 30px -12px rgba(30,27,75,.25)", fontSize: 12 };

export function SalesChart({ data, target, height = 280 }: { data: { date: string; tickets: number; cumulative: number }[]; target?: number; height?: number }) {
  if (!data.length) return <ChartEmpty height={height} />;
  return (
    <div style={{ height: height + 20 }} role="img" aria-label={`Ticket sales chart: ${data[data.length - 1].cumulative} tickets sold to date`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis yAxisId="d" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis yAxisId="c" orientation="right" tick={{ ...AXIS, fill: TEAL }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => shortDate(String(l))} />
          <Bar yAxisId="d" dataKey="tickets" name="Tickets that day" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Line yAxisId="c" dataKey="cumulative" name="Total sold" stroke={TEAL} strokeWidth={2.5} dot={false} type="monotone" />
          {target ? <ReferenceLine yAxisId="c" y={target} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: `Target ${target}`, fontSize: 11, fill: "#B45309", position: "insideTopLeft" }} /> : null}
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-500"><span><span className="mr-1 inline-block size-2 rounded-sm bg-brand-600" />Tickets per day (left axis)</span><span><span className="mr-1 inline-block h-0.5 w-3 bg-teal-accent align-middle" />Running total (right axis)</span>{target ? <span><span className="mr-1 inline-block h-0.5 w-3 border-t-2 border-dashed border-amber-500 align-middle" />Target</span> : null}</p>
    </div>
  );
}

export function TrendChart({ data, dataKey, height = 200, color = BRAND, name }: { data: Record<string, string | number>[]; dataKey: string; height?: number; color?: string; name?: string }) {
  if (!data.length) return <ChartEmpty height={height} />;
  const xKey = "date" in data[0] ? "date" : Object.keys(data[0])[0];
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={(v) => (/^\d{4}-/.test(String(v)) ? shortDate(String(v)) : String(v))} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area dataKey={dataKey} name={name ?? dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data, height = 220, color = BRAND, horizontal = false, name = "Value" }: { data: { label: string; value: number }[]; height?: number; color?: string; horizontal?: boolean; name?: string }) {
  if (!data.length || data.every((d) => d.value === 0)) return <ChartEmpty height={height} />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 6, right: 12, left: horizontal ? 8 : -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            </>
          )}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#EEF2FF" }} />
          <Bar dataKey="value" name={name} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ["#CBD5E1", BRAND, TEAL, "#F59E0B", "#10B981", "#EC4899"];
export function DonutChart({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data.some((d) => d.value > 0)) return <ChartEmpty height={height} />;
  return (
    <div style={{ height }} className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div style={{ height }} className="grid place-items-center rounded-xl bg-slate-50 text-sm text-slate-400">
      No data recorded yet
    </div>
  );
}
