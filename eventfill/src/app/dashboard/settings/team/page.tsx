import { requireOrg } from "@/lib/auth";
import { hasFeature } from "@/lib/entitlements";
import { listMembers } from "@/lib/data/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, UpgradeNotice } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/confirm";
import { env } from "@/lib/env";
import { InviteForm, RemoveMember, RevokeInvite } from "../forms";

export default async function TeamSettings() {
  const ctx = await requireOrg();
  const members = await listMembers(ctx);
  const canManage = ctx.role !== "member";
  const { data: invites } = canManage ? await ctx.supabase.from("organisation_invites").select("id, email, role, token, expires_at").eq("org_id", ctx.org.id).is("accepted_at", null).order("created_at") : { data: [] };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div><CardTitle>Members</CardTitle><CardDescription>{members.length} of {ctx.plan.teamMembers} seat(s) used</CardDescription></div></CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-medium">{m.name}{m.user_id === ctx.user.id && <span className="text-slate-400"> (you)</span>}</span>
                <span className="flex items-center gap-2"><Badge tone={m.role === "owner" ? "brand" : "neutral"}>{m.role}</Badge>{canManage && m.role !== "owner" && m.user_id !== ctx.user.id && <RemoveMember userId={m.user_id} name={m.name} />}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {!hasFeature(ctx, "teamCollaboration") ? (
        <UpgradeNotice feature="Team collaboration" plan="Pro" />
      ) : canManage ? (
        <Card>
          <CardHeader><div><CardTitle>Invite a teammate</CardTitle><CardDescription>EventFill creates a private invite link for you to send. The person must sign up or log in with the invited email address.</CardDescription></div></CardHeader>
          <CardContent className="space-y-5">
            <InviteForm />
            {invites?.length ? (
              <ul className="divide-y divide-slate-100">
                {invites.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>{i.email} <Badge>{i.role}</Badge> <span className="text-xs text-slate-400">expires {new Date(i.expires_at).toLocaleDateString("en-GB")}</span></span>
                    <span className="flex gap-2"><CopyButton text={`${env.siteUrl}/invite/${i.token}`} label="Copy invite link" /><RevokeInvite id={i.id} /></span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Alert tone="info">Ask an owner or admin to invite new teammates.</Alert>
      )}
    </div>
  );
}
