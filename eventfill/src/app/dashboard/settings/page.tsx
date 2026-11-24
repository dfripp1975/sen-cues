import { requireOrg } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgForm, ProfileForm } from "./forms";

export default async function GeneralSettings() {
  const ctx = await requireOrg();
  const { data: profile } = await ctx.supabase.from("profiles").select("full_name, marketing_emails").eq("id", ctx.user.id).maybeSingle();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><div><CardTitle>Your profile</CardTitle><CardDescription>{ctx.user.email}</CardDescription></div></CardHeader><CardContent><ProfileForm name={profile?.full_name ?? ""} marketing={profile?.marketing_emails ?? false} /></CardContent></Card>
      <Card><CardHeader><div><CardTitle>Organisation</CardTitle><CardDescription>{ctx.role === "member" ? "Only owners and admins can edit these settings." : "Applies to everyone in your organisation."}</CardDescription></div></CardHeader><CardContent><OrgForm org={ctx.org} disabled={ctx.role === "member"} /></CardContent></Card>
    </div>
  );
}
