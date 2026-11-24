// Tracking-link helpers: safe destination validation, UTM building and
// privacy-conscious click classification.

const BLOCKED_HOSTS = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^169\.254\./, /^\[?::1\]?$/, /\.local$/i, /\.internal$/i];

export function validateDestination(raw: string, ownHost?: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: "Enter a full URL starting with https://" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Only http and https links are allowed." };
  if (url.username || url.password) return { ok: false, error: "Links containing credentials are not allowed." };
  const host = url.hostname;
  if (!host.includes(".") || BLOCKED_HOSTS.some((r) => r.test(host))) return { ok: false, error: "That destination isn't allowed." };
  if (ownHost && host.toLowerCase() === ownHost.toLowerCase() && url.pathname.startsWith("/l/"))
    return { ok: false, error: "A tracking link can't point to another tracking link." };
  if (raw.length > 2000) return { ok: false, error: "URL is too long." };
  return { ok: true, url };
}

export interface Utm {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
}

export function buildDestination(destination: string, utm: Utm): string {
  const url = new URL(destination);
  for (const [k, v] of Object.entries(utm)) {
    if (v && v.trim()) url.searchParams.set(k, v.trim());
  }
  return url.toString();
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function generateSlug(length = 7): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9-]{4,40}$/.test(s);
}

export function classifyDevice(ua: string | null): "mobile" | "desktop" | "tablet" | "bot" | "unknown" {
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|linkedinbot|embedly/i.test(ua)) return "bot";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

export function referrerHost(ref: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.slice(0, 120);
  } catch {
    return null;
  }
}

export const CHANNELS = ["facebook", "instagram", "tiktok", "linkedin", "email", "community", "partnership", "other"] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  email: "Email",
  community: "Community groups",
  partnership: "Partnerships",
  other: "Other",
};
export const CHANNEL_MEDIUM: Record<Channel, string> = {
  facebook: "social",
  instagram: "social",
  tiktok: "social",
  linkedin: "social",
  email: "email",
  community: "community",
  partnership: "referral",
  other: "other",
};
