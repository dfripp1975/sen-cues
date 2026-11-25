import { z } from "zod";
import { isValidISODate } from "./dates";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const isoDate = z.string().refine(isValidISODate, "Enter a valid date");
const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isValidISODate(v), "Enter a valid date");
const time = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{2}:\d{2}(:\d{2})?$/.test(v), "Enter a valid time");
const money = z.coerce.number().min(0, "Must be 0 or more").max(100_000_000);
const optionalInt = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(10_000_000)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "Enter a full URL starting with https://");

export const EVENT_CATEGORIES = [
  ["networking", "Business networking"],
  ["workshop", "Workshop / training"],
  ["conference", "Conference"],
  ["music", "Music / gig"],
  ["charity", "Charity / fundraiser"],
  ["exhibition", "Exhibition / trade show"],
  ["community", "Community event"],
  ["sport", "Sport / fitness"],
  ["performing_arts", "Theatre / comedy / performing arts"],
  ["food_drink", "Food & drink"],
  ["festival", "Festival"],
  ["class", "Class / course"],
  ["tour", "Tour / experience"],
  ["other", "Other"],
] as const;
export const CATEGORY_LABELS = Object.fromEntries(EVENT_CATEGORIES) as Record<string, string>;

export const TICKETING_PLATFORMS = ["Eventbrite", "Ticket Tailor", "Humanitix", "Tito", "Skiddle", "Own website", "Other"];

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(100),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(128)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number"),
  terms: z.literal("on", { error: "You need to accept the terms to continue" }),
});

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(100),
  orgName: z.string().trim().min(1, "Enter your organisation name").max(120),
  eventTypes: z.array(z.string().max(40)).max(10),
  frequency: z.enum(["one-off", "monthly", "weekly", "quarterly", "several-a-year"]),
  platform: z.string().trim().max(60),
  country: z.string().trim().min(2).max(60),
  currency: z.string().regex(/^[A-Z]{3}$/, "Choose a currency"),
  timezone: z.string().trim().min(3).max(60),
});

export const eventSchema = z
  .object({
  name: z.string().trim().min(1, "Enter an event name").max(160),
  description: optionalText(5000),
  category: z.enum(EVENT_CATEGORIES.map(([v]) => v) as [string, ...string[]]),
  venue: optionalText(200),
  is_online: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  event_date: isoDate,
  end_date: optionalDate,
  start_time: time,
  end_time: time,
  timezone: z.string().trim().min(3).max(60),
  ticketing_platform: optionalText(60),
  booking_url: optionalUrl,
  capacity: optionalInt,
  ticket_target: z.coerce.number().int().min(0).max(10_000_000),
  marketing_budget: money.default(0),
  sales_start_date: optionalDate,
  notes: optionalText(5000),
  status: z.enum(["draft", "active", "completed", "archived"]).default("active"),
  is_template: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  })
  .refine((e) => !e.end_date || e.end_date >= e.event_date, { message: "The last day must be on or after the first day", path: ["end_date"] })
  .transform((e) => ({ ...e, end_date: e.end_date && e.end_date > e.event_date ? e.end_date : null }));

export const repeatSchema = z.object({
  recurrence: z.enum(["none", "weekly", "fortnightly", "monthly"]).default("none"),
  repeat_count: z.coerce.number().int().min(2, "A series needs at least 2 dates").max(52, "Up to 52 dates at a time").optional(),
});
export type EventInput = z.infer<typeof eventSchema>;

export const tierSchema = z.object({
  name: z.string().trim().min(1, "Name the tier").max(80),
  price: money,
  quantity: optionalInt,
});

export const saleSchema = z.object({
  sale_date: isoDate,
  quantity: z.coerce.number().int().min(0).max(100_000),
  revenue: money,
  refunds: z.coerce.number().int().min(0).max(100_000).default(0),
  refund_amount: money.default(0),
  tier_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  note: optionalText(300),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Name the campaign").max(120),
  event_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  channel: z.enum(["facebook", "instagram", "tiktok", "linkedin", "email", "community", "partnership", "other"]),
  status: z.enum(["planned", "active", "paused", "completed"]).default("planned"),
  start_date: optionalDate,
  end_date: optionalDate,
  budget: money.default(0),
  notes: optionalText(2000),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Describe the task").max(200),
  campaign_id: z.string().optional().transform((v) => (v ? v : null)),
  event_id: z.string().optional().transform((v) => (v ? v : null)),
  channel: optionalText(40),
  due_date: optionalDate,
});

export const linkSchema = z.object({
  label: z.string().trim().min(1, "Give the link a name").max(100),
  event_id: z.string().optional().transform((v) => (v ? v : null)),
  campaign_id: z.string().optional().transform((v) => (v ? v : null)),
  destination_url: z.string().trim().min(1, "Enter the destination URL").max(2000),
  utm_source: optionalText(80),
  utm_medium: optionalText(80),
  utm_campaign: optionalText(80),
  utm_content: optionalText(80),
});

export const competitorSchema = z.object({
  title: z.string().trim().min(1, "Enter the competing event's title").max(200),
  event_id: z.string().optional().transform((v) => (v ? v : null)),
  url: optionalUrl,
  event_date: optionalDate,
  price_min: z.union([z.literal(""), money]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
  price_max: z.union([z.literal(""), money]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
  description: optionalText(3000),
  benefits: optionalText(2000),
  notes: optionalText(2000),
});

export const moneyLineSchema = z.object({
  kind: z.enum(["income", "expense"]),
  category: z.string().min(1),
  description: optionalText(200),
  amount: money,
  is_estimate: z.string().optional().transform((v) => v === "on" || v === "true"),
});

export const SURVEY_TYPES = [
  ["pre_event_interest", "Pre-event interest"],
  ["post_event_feedback", "Post-event feedback"],
  ["attendance_intention", "Attendance intention"],
  ["reasons_not_booking", "Reasons for not booking"],
  ["custom", "Custom"],
] as const;

export const questionSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(["text", "rating", "choice", "yesno"]),
  label: z.string().trim().min(1).max(300),
  options: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
  required: z.boolean().default(false),
});
export type SurveyQuestion = z.infer<typeof questionSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.email("Enter a valid email address"),
  topic: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(5000),
  website: z.string().max(0).optional(), // honeypot
});
