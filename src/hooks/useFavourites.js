import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Loads favourites for the current (anonymous) user and keeps them in sync
// with Supabase. Falls back to an empty set if the user isn't loaded yet.
export function useFavourites() {
  const [favourites, setFavourites] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data, error } = await supabase.from("favourites").select("situation_id").eq("user_id", userData.user.id);
    if (!error && data) {
      setFavourites(new Set(data.map((row) => row.situation_id)));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavourite = useCallback(
    async (situationId) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const isFav = favourites.has(situationId);

      // Optimistic update
      setFavourites((prev) => {
        const next = new Set(prev);
        isFav ? next.delete(situationId) : next.add(situationId);
        return next;
      });

      if (isFav) {
        await supabase.from("favourites").delete().eq("user_id", userData.user.id).eq("situation_id", situationId);
      } else {
        await supabase.from("favourites").insert({ user_id: userData.user.id, situation_id: situationId });
      }
    },
    [favourites]
  );

  return { favourites, toggleFavourite, loaded };
}
