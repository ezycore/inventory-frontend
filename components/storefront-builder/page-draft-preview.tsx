"use client";
// coding-standard: maintained

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { storefrontApi } from "@/lib/storefront-client";
import { isPreviewSession, PAGE_EDITOR_ATTR } from "@/lib/storefront-preview";
import {
  PAGE_DRAFT_APPLIED,
  PAGE_DRAFT_MESSAGE,
  PAGE_DRAFT_READY,
  PAGE_PREVIEW_CART,
  PAGE_SECTION_FOCUS,
  PAGE_SECTION_SELECT,
} from "@/lib/storefront-builder/page-draft-messages";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";
import type { ProductsDataRequest, SectionData } from "@/lib/storefront-builder/section-data";
import { storefront } from "@/services/storefront/hooks";
import { usePreviewCartStore } from "@/services/stores/use-preview-cart-store";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";
import type { SectionContext } from "@/components/storefront-builder/section-view";

export { PAGE_DRAFT_APPLIED, PAGE_DRAFT_MESSAGE, PAGE_DRAFT_READY };

/** What a product request asks for, apart from the instance it is filed under. */
export const requestSignature = (request: ProductsDataRequest): string =>
  JSON.stringify({ ...request, key: "" });

/** The id a single re-query is filed under in its one-request call. */
const SINGLE_KEY = "preview";

/**
 * Hover and selection outlines, added to the page only while the editor drives
 * it. A floating section's frame has no box to outline (`display: contents`), so
 * its pinned content carries the outline instead.
 */
const EDITOR_FRAME_CSS =
  "[data-section-id]{cursor:pointer}" +
  "[data-section-id]:hover{outline:2px dashed #2563eb;outline-offset:-2px}" +
  "[data-section-focused]{outline:2px solid #2563eb;outline-offset:-2px}" +
  "[data-float][data-section-id] .sfb-inner>*:hover{outline:2px dashed #2563eb;outline-offset:-2px}" +
  "[data-float][data-section-focused] .sfb-inner>*{outline:2px solid #2563eb;outline-offset:-2px}" +
  // The header's and footer's links do nothing here — see `onClick` — so they
  // must not look clickable either.
  `[${PAGE_EDITOR_ATTR}] a[href]:not([data-section-id] a){cursor:default}`;

/** The messages only the page editor sends — never the Customize editor. */
const PAGE_EDITOR_MESSAGES = new Set([PAGE_DRAFT_MESSAGE, PAGE_SECTION_FOCUS, PAGE_PREVIEW_CART]);

/** Marks the section the editor has open, clearing any other; returns its element. */
function markFocusedSection(id: string | null): Element | null {
  document
    .querySelectorAll("[data-section-focused]")
    .forEach((node) => node.removeAttribute("data-section-focused"));
  if (!id) return null;
  const section = document.querySelector(`[data-section-id="${CSS.escape(id)}"]`);
  section?.setAttribute("data-section-focused", "");
  return section;
}

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
 *
 * `pageContext` is the system page it draws, when that page supplies a setting
 * itself (`fromPage`): without it the product page's add-ons would read as
 * missing their product and drop out of the redraw.
 */
export function PageDraftPreview({
  slug,
  instances,
  data,
  context,
  pageContext,
}: {
  slug: string;
  instances: PageSectionInstance[];
  data: Record<string, SectionData>;
  context: SectionContext;
  pageContext?: SectionPageContext;
}) {
  const [draft, setDraft] = useState(instances);
  // The section open in the editor. A ref, not state: marking it is a DOM change,
  // re-applied after each redraw, and it must not redraw the page itself.
  const focusedId = useRef<string | null>(null);
  // The cart/checkout preview's sample-basket switch. A store rather than state
  // here because the cart page's core section reads it from deep inside the shop's
  // own view (`usePreviewCart`), not through a section prop.
  const setCartFilled = usePreviewCartStore((s) => s.setFilled);
  /* Whether the PAGE editor is the one driving this frame. `isPreviewSession()`
     alone cannot say: the Customize editor's frame is a preview session too, and
     a merchant browsing their shop there reaches builder pages that mount this.
     Browsing is the point of that frame, so the chrome's links stay live there;
     only a parent that has posted a page draft turns them off. */
  const editorDriven = useRef(false);

  useEffect(() => {
    if (!isPreviewSession()) return;

    const style = document.createElement("style");
    style.textContent = EDITOR_FRAME_CSS;
    document.head.appendChild(style);

    const onMessage = (event: MessageEvent) => {
      // Only the frame's own parent — the editor — may drive the page.
      if (event.source !== window.parent) return;
      if (PAGE_EDITOR_MESSAGES.has(event.data?.type) && !editorDriven.current) {
        editorDriven.current = true;
        document.documentElement.setAttribute(PAGE_EDITOR_ATTR, "");
      }
      if (event.data?.type === PAGE_SECTION_FOCUS) {
        const id = typeof event.data.payload?.id === "string" ? event.data.payload.id : null;
        focusedId.current = id;
        const section = markFocusedSection(id);
        // The frame's own window only: `scrollIntoView` scrolls every scrollable
        // ancestor, the editor page around the frame included.
        if (section) {
          const box = section.getBoundingClientRect();
          if (box.top < 0 || box.bottom > window.innerHeight) {
            window.scrollTo({ top: window.scrollY + box.top - 16, behavior: "smooth" });
          }
        }
        return;
      }
      if (event.data?.type === PAGE_PREVIEW_CART) {
        // Anything but an explicit `false` means "show the sample" — a frame
        // that reloads mid-edit must come back with a cart, not with the empty
        // state the merchant did not ask for.
        setCartFilled(event.data.payload?.filled !== false);
        return;
      }
      if (event.data?.type !== PAGE_DRAFT_MESSAGE) return;
      const sections = event.data.payload?.sections;
      if (!Array.isArray(sections)) return;
      setDraft(sections as PageSectionInstance[]);
      window.parent.postMessage({ type: PAGE_DRAFT_APPLIED }, "*");
    };

    // Editing, not browsing: a click on a section picks it instead of following
    // whatever link it landed on.
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const section = target?.closest("[data-section-id]");
      if (!section) {
        /* The header and footer are the page's chrome, drawn by the layout rather
           than as sections, so there is nothing to select. Their links — the
           logo, the menu, the cart icon — would still navigate the frame off the
           page being edited, onto an address the editor is not previewing. */
        if (editorDriven.current && target?.closest("a[href]")) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      /* One exception: the sample cart's own controls. This capture runs on
         `document` and stops propagation, so React never sees the click — the
         stepper, the remove button and the sample checkout's fields were all
         inert, which is the same dead-control defect the sample exists to fix.
         Scoped to `[data-preview-interactive]`, which ONLY a sample basket draws
         (`cart-page.tsx`, `checkout-page.tsx`): the product page's Add to cart
         must stay captured, or a click while editing would put a product in the
         merchant's own basket. Links stay captured everywhere — following one
         would navigate the frame out of the page being edited. */
      if (
        target?.closest("[data-preview-interactive]") &&
        target.closest("button, input, select, textarea, label")
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage(
        { type: PAGE_SECTION_SELECT, payload: { id: section.getAttribute("data-section-id") } },
        "*",
      );
    };

    // A form navigates without a click: Enter in the header's search box, or a
    // newsletter signup that would really subscribe. Only the sample basket's
    // own fields are the merchant's to use.
    const onSubmit = (event: SubmitEvent) => {
      if (!editorDriven.current) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-preview-interactive]")) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.parent?.postMessage({ type: PAGE_DRAFT_READY }, "*");
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.documentElement.removeAttribute(PAGE_EDITOR_ATTR);
      editorDriven.current = false;
      style.remove();
    };
  }, [setCartFilled]);

  // A redraw can replace the focused section's element; mark it again.
  useEffect(() => {
    markFocusedSection(focusedId.current);
  }, [draft]);

  // The server's answers, filed by the query that produced them.
  const served = useMemo(() => {
    const bySignature = new Map<string, SectionData>();
    for (const request of sectionDataRequests(prepareSections(instances, pageContext))) {
      const answer = data[request.key];
      if (answer) bySignature.set(requestSignature(request), answer);
    }
    return bySignature;
  }, [instances, data, pageContext]);

  const sections = useMemo(() => prepareSections(draft, pageContext), [draft, pageContext]);
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

  return <PageSections sections={sections} context={context} data={dataById} annotate />;
}
