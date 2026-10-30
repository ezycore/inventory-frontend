// coding-standard: maintained
import { redirect } from "next/navigation";

/**
 * Reports → Export Data moved into the Import & Export center's Export tab
 * (backend `docs/plan/import-export-center.md` D4). Merchants have this URL
 * bookmarked, so it sends them there rather than 404ing.
 */
export default function ExportDataPage() {
  redirect("/import-export?tab=export");
}
