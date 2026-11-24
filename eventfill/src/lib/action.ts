import "server-only";
import { z } from "zod";
import { PlanLimitError } from "@/lib/entitlements";
import { logError } from "@/lib/ops";

export type ActionResult = { ok: true; data?: unknown; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Wraps a server action so expected errors become friendly messages. */
export async function safeAction(name: string, fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof PlanLimitError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
      return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
    }
    // Next.js redirect()/notFound() throw special errors that must propagate.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    await logError(name, e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export function formToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string") o[k] = v;
  });
  return o;
}
