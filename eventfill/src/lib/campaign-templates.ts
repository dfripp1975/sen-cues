// Ready-made promotional plans. Offsets are days before the event date.
export interface PlanTask {
  offset: number;
  title: string;
  channel: string;
}

export const CAMPAIGN_TEMPLATES: Record<string, { name: string; summary: string; tasks: PlanTask[] }> = {
  networking: {
    name: "Networking event plan",
    summary: "LinkedIn-led with community and email support, building over four weeks.",
    tasks: [
      { offset: 28, title: "Publish event on LinkedIn Events and share from personal profiles", channel: "linkedin" },
      { offset: 25, title: "Ask local business groups / chamber of commerce to share", channel: "community" },
      { offset: 21, title: "Email past attendees (opted-in) with early booking link", channel: "email" },
      { offset: 14, title: "LinkedIn post: who will be in the room and why it's worth attending", channel: "linkedin" },
      { offset: 10, title: "Partner shout-out: venue or sponsor shares the event", channel: "partnership" },
      { offset: 7, title: "One-week-to-go reminder post", channel: "linkedin" },
      { offset: 3, title: "Final reminder email to opted-in contacts", channel: "email" },
      { offset: 1, title: "Day-before post with practical details", channel: "linkedin" },
    ],
  },
  workshop: {
    name: "Workshop plan",
    summary: "Benefit-led messaging aimed at professionals and learners.",
    tasks: [
      { offset: 35, title: "Write a benefits-first description: what attendees will be able to do", channel: "other" },
      { offset: 30, title: "Announce on LinkedIn with learning outcomes", channel: "linkedin" },
      { offset: 24, title: "Share in relevant professional communities (following group rules)", channel: "community" },
      { offset: 18, title: "Email newsletter feature to opted-in subscribers", channel: "email" },
      { offset: 12, title: "Short video or carousel: a tip from the workshop", channel: "instagram" },
      { offset: 7, title: "Limited places reminder (only if genuinely limited)", channel: "linkedin" },
      { offset: 2, title: "Final reminder with joining or venue details", channel: "email" },
    ],
  },
  conference: {
    name: "Conference plan",
    summary: "Phased launch: announcement, speaker reveals, early-bird, final push.",
    tasks: [
      { offset: 90, title: "Launch announcement across all channels", channel: "linkedin" },
      { offset: 75, title: "Speaker reveal #1 with tracking link", channel: "linkedin" },
      { offset: 60, title: "Early-bird deadline email (real deadline)", channel: "email" },
      { offset: 50, title: "Ask speakers and sponsors to share with their audiences", channel: "partnership" },
      { offset: 40, title: "Speaker reveal #2 and agenda highlight", channel: "linkedin" },
      { offset: 30, title: "Industry newsletter / association mailing", channel: "partnership" },
      { offset: 14, title: "Two weeks to go: agenda and networking highlights", channel: "email" },
      { offset: 3, title: "Final reminder with venue and timings", channel: "email" },
    ],
  },
  charity: {
    name: "Charity event plan",
    summary: "Story-led promotion with community partners and local press.",
    tasks: [
      { offset: 42, title: "Share the cause story and event announcement on Facebook", channel: "facebook" },
      { offset: 35, title: "Contact partner charities and supporters to share", channel: "partnership" },
      { offset: 28, title: "Post in local community groups (following group rules)", channel: "community" },
      { offset: 21, title: "Send press release to local media", channel: "other" },
      { offset: 14, title: "Supporter email: invite friends and family", channel: "email" },
      { offset: 7, title: "Behind-the-scenes post: volunteers and preparations", channel: "instagram" },
      { offset: 2, title: "Final reminder with practical details", channel: "facebook" },
    ],
  },
  music: {
    name: "Music event plan",
    summary: "Visual, short-form content with artist and venue cross-promotion.",
    tasks: [
      { offset: 42, title: "Announce line-up with artwork on Instagram", channel: "instagram" },
      { offset: 38, title: "Ask artists and venue to share with their tracking links", channel: "partnership" },
      { offset: 30, title: "TikTok / Reel: clip of the headline act", channel: "tiktok" },
      { offset: 21, title: "Submit to local listings sites and venue mailing list", channel: "community" },
      { offset: 14, title: "Support act spotlight post", channel: "instagram" },
      { offset: 7, title: "One week to go countdown story", channel: "instagram" },
      { offset: 1, title: "Day-before post: set times and entry info", channel: "instagram" },
    ],
  },
  exhibition: {
    name: "Exhibition plan",
    summary: "Exhibitor-powered promotion with trade and visual channels.",
    tasks: [
      { offset: 60, title: "Announce dates and exhibitor list", channel: "linkedin" },
      { offset: 50, title: "Provide exhibitors with share kits and tracking links", channel: "partnership" },
      { offset: 40, title: "Trade association / industry mailing", channel: "partnership" },
      { offset: 30, title: "Exhibitor spotlight series begins", channel: "instagram" },
      { offset: 14, title: "Visitor guide email to opted-in contacts", channel: "email" },
      { offset: 5, title: "Final reminder: opening times and travel", channel: "email" },
    ],
  },
  community: {
    name: "Community event plan",
    summary: "Local, friendly promotion through groups, noticeboards and partners.",
    tasks: [
      { offset: 28, title: "Create Facebook event and invite local groups", channel: "facebook" },
      { offset: 24, title: "Put up posters with QR code (tracking link) at local venues", channel: "community" },
      { offset: 18, title: "Ask local businesses and schools to share", channel: "partnership" },
      { offset: 12, title: "Post in neighbourhood groups (following group rules)", channel: "community" },
      { offset: 6, title: "Photo post: preparations and what to expect", channel: "instagram" },
      { offset: 1, title: "Day-before reminder with timings", channel: "facebook" },
    ],
  },
};
