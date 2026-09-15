"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { storefrontApi } from "@/lib/storefront-client";
import type { ProductsDataRequest, SectionData } from "@/lib/storefront-builder/section-data";
import { storefront } from "@/services/storefront/hooks";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";
import type { SectionContext } from "@/components/storefront-builder/section-view";

/** Editor → preview frame: the page's sections as they are now, saved or not. */
export const PAGE_DRAFT_MESSAGE = "ezycore-page-draft";
/** Preview frame → editor: mounted and listening, send the sections. */
export const PAGE_DRAFT_READY = "ezycore-page-draft-ready";
/** Preview frame → editor: the last sections sent are on screen. */
export const PAGE_DRAFT_APPLIED = "ezycore-page-draft-applied";

/** What a product request asks for, apart from the instance it is filed under. */
export const requestSignature = (request: ProductsDataRequest): string =>
  JSON.stringify({ ...request, key: "" });

/** The id a single re-query is filed under in its one-request call. */
const SINGLE_KEY = "preview";

/**
 * A builder page in the editor's preview frame, redrawn as the merchant edits —
 * before anything is saved.
 *
 * It draws with the registry and views the shop itself uses, so the preview is
 * the storefront rather than a copy of it. Only in the editor's frame
 * (`?preview=1`) does it listen: the parent posts the page's sections, this
 * redraws and acknowledges.
 *
 * Products are reused **by query, not by section**: a section whose query did
 * not change keeps the server's answer, and only a changed query is fetched —
 * one small request each, keeping the previous products on screen while it
 * loads rather than letting the section vanish and reappear.
 */
export function PageDraftPreview({
  slug,
  instances,
  data,
  context,
}: {
  slug: string;
  instances: PageSectionInstance[];
  data: Record<string, SectionData>;
  context: SectionContext;
}) {
  const [draft, setDraft] = useState(instances);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") !== "1") return;
    const onMessage = (event: MessageEvent) => {
      // Only the frame's own parent — the editor — may redraw the page.
      if (event.source !== window.parent || event.data?.type !== PAGE_DRAFT_MESSAGE) return;
      const sections = event.data.payload?.sections;
      if (!Array.isArray(sections)) return;
      setDraft(sections as PageSectionInstance[]);
      window.parent.postMessage({ type: PAGE_DRAFT_APPLIED }, "*");
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: PAGE_DRAFT_READY }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The server's answers, filed by the query that produced them.
  const served = useMemo(() => {
    const bySignature = new Map<string, SectionData>();
    for (const request of sectionDataRequests(prepareSections(instances))) {
      const answer = data[request.key];
      if (answer) bySignature.set(requestSignature(request), answer);
    }
    return bySignature;
  }, [instances, data]);

  const sections = useMemo(() => prepareSections(draft), [draft]);
  const requests = useMemo(() => sectionDataRequests(sections), [sections]);
  const missing = requests.filter((request) => !served.has(requestSignature(request)));

  const answers = useQueries({
    queries: missing.map((request) => ({
      queryKey: storefront.sectionData(slug, requestSignature(request)),
      queryFn: async () => {
        const response = await storefrontApi.sectionData(slug, [{ ...request, key: SINGLE_KEY }]);
        return response?.results?.[SINGLE_KEY] ?? { items: [] };
      },
      placeholderData: keepPreviousData,
      staleTime: 60_000,
    })),
  });

  const dataById: Record<string, SectionData> = {};
  const fetched = new Map(missing.map((request, index) => [request.key, answers[index]?.data]));
  for (const request of requests) {
    const answer = served.get(requestSignature(request)) ?? fetched.get(request.key);
    if (answer) dataById[request.key] = answer;
  }

  return <PageSections sections={sections} context={context} data={dataById} />;
}
