"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";

const COOKIE = "ef_cookie_prefs";

export function CookiePreferences() {
  const [analytics, setAnalytics] = React.useState(false);
  React.useEffect(() => {
    const m = document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
    if (m) setAnalytics(decodeURIComponent(m[1]).includes("analytics:1"));
  }, []);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
      <Checkbox label="Essential cookies (required)" checked disabled readOnly />
      <Checkbox className="mt-3" label="Analytics cookies (none in use today)" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
      <Button
        className="mt-5"
        onClick={() => {
          document.cookie = `${COOKIE}=${encodeURIComponent(`analytics:${analytics ? 1 : 0}`)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
          toast.success("Cookie preferences saved");
        }}
      >
        Save preferences
      </Button>
    </div>
  );
}
