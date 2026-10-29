// coding-standard: maintained
import { useMyLocations } from "@/hooks";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * The name of the location stock imports and exports go to: the active one, as
 * the header's location switcher shows it. The center says so on its stock
 * cards, because nothing else on that page tells the merchant which shop.
 */
export function useActiveLocationName(): string {
  const { user, activeLocationId } = useAuthStore();
  const { data } = useMyLocations();
  const locations = data?.data ?? [];
  const id = activeLocationId ?? user?.defaultLocationId;
  // "…" until the locations arrive, not an empty gap in the sentence.
  return locations.find((location) => location._id === id)?.name ?? "…";
}
