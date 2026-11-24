export interface EventRow {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string;
  venue: string | null;
  is_online: boolean;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  ticketing_platform: string | null;
  booking_url: string | null;
  capacity: number | null;
  ticket_target: number;
  marketing_budget: number;
  image_url: string | null;
  notes: string | null;
  sales_start_date: string | null;
  attendance: number | null;
  lessons_learned: string | null;
  status: "draft" | "active" | "completed" | "archived";
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierRow {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number | null;
}

export interface SaleRecord {
  id: string;
  event_id: string;
  tier_id: string | null;
  sale_date: string;
  quantity: number;
  revenue: number;
  refunds: number;
  refund_amount: number;
  source: "manual" | "csv";
  note: string | null;
  created_at: string;
}

export interface CampaignRow {
  id: string;
  event_id: string | null;
  name: string;
  channel: string;
  status: "planned" | "active" | "paused" | "completed";
  start_date: string | null;
  end_date: string | null;
  budget: number;
  notes: string | null;
}

export interface TaskRow {
  id: string;
  event_id: string | null;
  campaign_id: string | null;
  title: string;
  channel: string | null;
  due_date: string | null;
  status: "todo" | "in_progress" | "done";
  assignee_id: string | null;
}

export interface RescueActionRow {
  id: string;
  event_id: string;
  recommendation_key: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  status: "todo" | "in_progress" | "done";
  tickets_at_creation: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface LinkRow {
  id: string;
  event_id: string | null;
  campaign_id: string | null;
  slug: string;
  label: string;
  destination_url: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MoneyRow {
  id: string;
  event_id: string;
  category: string;
  description: string | null;
  amount: number;
  is_estimate: boolean;
}
