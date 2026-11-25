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
  sport: {
    name: "Sports event plan",
    summary: "Club, community and social promotion, with a push as entries close.",
    tasks: [
      { offset: 56, title: "Announce the event with route, course or format details", channel: "instagram" },
      { offset: 49, title: "Ask local clubs, leagues and gyms to share with members", channel: "partnership" },
      { offset: 42, title: "Post in running, cycling or sports community groups (following group rules)", channel: "community" },
      { offset: 28, title: "Email past participants (opted-in) with the entry link", channel: "email" },
      { offset: 21, title: "Training tips or behind-the-scenes post", channel: "instagram" },
      { offset: 10, title: "Entries-closing reminder (only if there is a real closing date)", channel: "facebook" },
      { offset: 2, title: "Final practical info: start times, kit, parking", channel: "email" },
    ],
  },
  performing_arts: {
    name: "Theatre, comedy & performance plan",
    summary: "Performer-led social content plus listings and the venue's audience.",
    tasks: [
      { offset: 42, title: "Announce the show with artwork and a short description", channel: "instagram" },
      { offset: 38, title: "Submit to local what's-on listings", channel: "community" },
      { offset: 35, title: "Ask performers and the venue to share with their own tracking links", channel: "partnership" },
      { offset: 24, title: "Short clip, rehearsal photo or teaser video", channel: "tiktok" },
      { offset: 14, title: "Venue / past-audience mailing (opted-in)", channel: "email" },
      { offset: 7, title: "One week to go post", channel: "facebook" },
      { offset: 1, title: "Day-before reminder: doors, running time, access info", channel: "instagram" },
    ],
  },
  food_drink: {
    name: "Food & drink event plan",
    summary: "Visual, menu-led promotion with producer and venue partners.",
    tasks: [
      { offset: 35, title: "Announce with photos and the menu or producer line-up", channel: "instagram" },
      { offset: 30, title: "Ask producers, chefs and the venue to share", channel: "partnership" },
      { offset: 24, title: "Contact local food bloggers and listings", channel: "community" },
      { offset: 17, title: "Spotlight post on a dish, drink or producer", channel: "instagram" },
      { offset: 10, title: "Email opted-in contacts with the booking link", channel: "email" },
      { offset: 3, title: "Final reminder with dietary and access information", channel: "facebook" },
    ],
  },
  festival: {
    name: "Festival plan",
    summary: "Long-lead launch, line-up reveals and a final push across channels.",
    tasks: [
      { offset: 90, title: "Launch announcement with dates and first names", channel: "instagram" },
      { offset: 75, title: "Line-up reveal #1", channel: "instagram" },
      { offset: 60, title: "Submit to regional and national what's-on listings", channel: "community" },
      { offset: 50, title: "Give performers, traders and sponsors share kits with tracking links", channel: "partnership" },
      { offset: 40, title: "Line-up reveal #2 / short video", channel: "tiktok" },
      { offset: 28, title: "Email past attendees (opted-in) with ticket options", channel: "email" },
      { offset: 14, title: "Practical guide post: travel, camping or parking, accessibility", channel: "facebook" },
      { offset: 3, title: "Final reminder and day-by-day timetable", channel: "email" },
    ],
  },
  class: {
    name: "Class or course plan",
    summary: "Benefit-led posts and community sharing ahead of the start date.",
    tasks: [
      { offset: 28, title: "Describe what learners will be able to do by the end", channel: "other" },
      { offset: 24, title: "Announce on social with a photo of a previous session", channel: "instagram" },
      { offset: 20, title: "Share in local community groups (following group rules)", channel: "community" },
      { offset: 14, title: "Email past learners (opted-in) with the booking link", channel: "email" },
      { offset: 7, title: "Short tip or demo video from the teacher", channel: "instagram" },
      { offset: 2, title: "Reminder with what to bring and where to go", channel: "email" },
    ],
  },
  tour: {
    name: "Tour or experience plan",
    summary: "Listings, reviews and local partners such as hotels and visitor centres.",
    tasks: [
      { offset: 42, title: "List on review and experience sites with clear photos", channel: "community" },
      { offset: 35, title: "Contact local hotels, B&Bs and visitor centres", channel: "partnership" },
      { offset: 28, title: "Photo or short video from a previous tour", channel: "instagram" },
      { offset: 21, title: "Ask past guests (opted-in) to share or leave a genuine review", channel: "email" },
      { offset: 10, title: "Seasonal or themed post highlighting what guests will see", channel: "facebook" },
      { offset: 2, title: "Meeting point and what-to-bring reminder", channel: "email" },
    ],
  },
};
