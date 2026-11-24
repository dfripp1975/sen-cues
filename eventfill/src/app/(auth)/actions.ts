"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { formToObject } from "@/lib/action";
import { rateLimit } from "@/lib/ops";
import { loginSchema, registerSchema } from "@/lib/validation";
import type { ActionState } from "@/components/ui/action-form";

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function fieldErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** Only allow same-site relative redirects. */
function safeNext(next: string | undefined | null, fallback = "/dashboard") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit(`login:${await clientIp()}`, 900, 20))) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "Please confirm your email address first. Check your inbox for the verification link." };
    return { ok: false, error: "Incorrect email or password." };
  }
  redirect(safeNext(fd.get("next") as string));
}

export async function signUp(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit(`register:${await clientIp()}`, 3600, 10))) return { ok: false, error: "Too many sign-ups from this network. Please try again later." };
  const supabase = await createClient();
  const next = safeNext(fd.get("next") as string, "/onboarding");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { ok: false, error: "Please choose a stronger password.", fieldErrors: { password: error.message } };
    return { ok: false, error: "We couldn't create your account. If you already have one, try logging in." };
  }
  // If email confirmation is disabled in Supabase, a session is returned immediately.
  if (data.session) redirect(next);
  redirect(`/check-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function requestPasswordReset(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = z.email().safeParse(fd.get("email"));
  if (!email.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: { email: "Enter a valid email address" } };
  if (!(await rateLimit(`reset:${await clientIp()}`, 3600, 5))) return { ok: false, error: "Too many requests. Please try again later." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password` });
  // Same response whether or not the account exists, to avoid revealing accounts.
  return { ok: true, message: "If an account exists for that email, we've sent a reset link." };
}

export async function updatePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const pw = registerSchema.shape.password.safeParse(fd.get("password"));
  if (!pw.success) return { ok: false, error: "Please choose a stronger password.", fieldErrors: { password: pw.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { ok: false, error: "Passwords don't match.", fieldErrors: { confirm: "Passwords don't match" } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { ok: false, error: "Your reset link may have expired. Request a new one." };
  redirect("/dashboard?passwordUpdated=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
