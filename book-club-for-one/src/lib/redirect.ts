/** Where to go after signing in or up: the ?redirect= page on this site, else the library. */
export function safeRedirect(search: string, fallback = '/library'): string {
  const target = new URLSearchParams(search).get('redirect') || '';
  // Only paths on this site: "/clubs/join/abc", never "//other.site" or "https://…"
  return /^\/(?!\/)[\w\-/?=&.%]*$/.test(target) ? target : fallback;
}
