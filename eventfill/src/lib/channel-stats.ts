import type { ChannelStat } from "./rescue";
import { CHANNEL_LABELS, type Channel } from "./tracking";

export function buildChannelStats(campaigns: { id: string; channel: string }[], links: { id: string; campaign_id: string | null; utm_source: string | null }[], clicks: { link_id: string }[]): ChannelStat[] {
  const map = new Map<string, ChannelStat>();
  const label = (c: string) => CHANNEL_LABELS[c as Channel] ?? c;
  for (const c of campaigns) {
    const k = label(c.channel);
    const cur = map.get(k) ?? { channel: k, clicks: 0, campaigns: 0 };
    cur.campaigns++;
    map.set(k, cur);
  }
  for (const l of links) {
    const camp = campaigns.find((c) => c.id === l.campaign_id);
    const k = camp ? label(camp.channel) : l.utm_source ?? "Other";
    const cur = map.get(k) ?? { channel: k, clicks: 0, campaigns: 0 };
    cur.clicks += clicks.filter((x) => x.link_id === l.id).length;
    map.set(k, cur);
  }
  return [...map.values()];
}
