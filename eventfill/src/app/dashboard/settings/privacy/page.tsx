import { Download } from "lucide-react";
import { requireOrg } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteAccountForm } from "../forms";

export default async function PrivacySettings() {
  const ctx = await requireOrg();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div><CardTitle>Export your data</CardTitle><CardDescription>Download everything stored for {ctx.org.name} as a JSON file.</CardDescription></div></CardHeader>
        <CardContent><Button asChild variant="secondary"><a href="/dashboard/settings/privacy/export"><Download /> Download data export</a></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><div><CardTitle>Data retention</CardTitle><CardDescription>Tracking-link clicks and survey responses older than {ctx.org.data_retention_months} months are deleted automatically. Change this in General settings.</CardDescription></div></CardHeader>
      </Card>
      <Card className="ring-red-200">
        <CardHeader><div><CardTitle className="text-red-700">Delete account</CardTitle><CardDescription>Permanently delete your login{ctx.role === "owner" ? " and organisations you own alone" : ""}.</CardDescription></div></CardHeader>
        <CardContent><DeleteAccountForm /></CardContent>
      </Card>
    </div>
  );
}
