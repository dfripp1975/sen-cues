"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveSupportMessage(id: string) {
  await requireAdmin();
  z.string().uuid().parse(id);
  await createAdminClient().from("support_messages").update({ status: "resolved" }).eq("id", id);
  revalidatePath("/admin");
  return { ok: true, message: "Marked as resolved" };
}
