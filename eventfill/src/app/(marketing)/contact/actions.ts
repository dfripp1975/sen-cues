"use server";
import { headers } from "next/headers";
import { contactSchema } from "@/lib/validation";
import { formToObject } from "@/lib/action";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ops";
import type { ActionState } from "@/components/ui/action-form";

export async function sendContact(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please check the form.", fieldErrors };
  }
  if (parsed.data.website) return { ok: true, message: "Thanks — we'll be in touch." }; // honeypot
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`contact:${ip}`, 3600, 5))) return { ok: false, error: "Too many messages. Please try again later." };
  try {
    const db = createAdminClient();
    const { error } = await db.from("support_messages").insert({ name: parsed.data.name, email: parsed.data.email, topic: parsed.data.topic, message: parsed.data.message });
    if (error) throw error;
  } catch {
    return { ok: false, error: "We couldn't send your message right now. Please try again later." };
  }
  return { ok: true, message: "Thanks — your message has been sent. We'll reply by email." };
}
