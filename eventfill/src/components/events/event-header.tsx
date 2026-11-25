import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Monitor, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/validation";
import { formatDate, formatDateRange } from "@/lib/dates";
import type { EventRow } from "@/types/db";

export function EventHeader({ event, base, actions, eyebrow, seriesName }: { event: EventRow; base: string; actions?: React.ReactNode; eyebrow?: React.ReactNode; seriesName?: string | null }) {
  return (
    <div className="mb-4">
      <Link href={`${base}/events`} className="no-print inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy"><ArrowLeft className="size-4" aria-hidden /> All events</Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt="" className="hidden size-16 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 sm:block" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow}
              <Badge tone="brand">{CATEGORY_LABELS[event.category] ?? event.category}</Badge>
              {event.status !== "active" && <Badge>{event.status}</Badge>}
              {event.is_template && <Badge tone="teal">Template</Badge>}
              {event.series_id && (
                <Link href={`${base}/series/${event.series_id}`} className="no-print">
                  <Badge tone="teal"><Repeat className="size-3" aria-hidden /> {seriesName ? `Series: ${seriesName}` : "Part of a series"}</Badge>
                </Link>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{event.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />{event.end_date ? formatDateRange(event.event_date, event.end_date, { weekday: true }) : formatDate(event.event_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}{event.start_time ? `, ${event.start_time.slice(0, 5)}` : ""}</span>
              <span className="inline-flex items-center gap-1.5">{event.is_online ? <Monitor className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}{event.is_online ? "Online" : event.venue ?? "Venue TBC"}</span>
              {event.booking_url && (
                <a href={event.booking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">Booking page <ExternalLink className="size-3.5" aria-hidden /></a>
              )}
            </p>
          </div>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
