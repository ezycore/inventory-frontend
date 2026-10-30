// coding-standard: maintained
import { redirect } from "next/navigation";

/**
 * Moving a shop in is the Import & Export center's "Move your shop" tab now
 * (backend `docs/plan/import-export-center.md`). A link to a run (`?run=`) keeps
 * pointing at the same run.
 */
export default async function MigratePage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run } = await searchParams;
  redirect(`/import-export?tab=move${run ? `&run=${encodeURIComponent(run)}` : ""}`);
}
