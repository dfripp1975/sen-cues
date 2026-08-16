import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// TODO: once RevenueCat is wired up, this should read entitlement status from
// RevenueCat instead of (or in addition to) the accounts.is_premium column.
// The Supabase column is a good source of truth for the free MVP / manual testing.
export function usePremium(navigation) {
  const [isPremium, setIsPremium] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data } = await supabase.from("accounts").select("is_premium").eq("user_id", userData.user.id).single();
    if (data) setIsPremium(!!data.is_premium);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openPaywall = useCallback(() => {
    navigation?.navigate("Paywall");
  }, [navigation]);

  return { isPremium, openPaywall, refresh: load };
}
