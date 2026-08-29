// coding-standard: maintained
/**
 * `TagRowConfig` — the three states a saved tag id can be in, which are easy to
 * collapse into two and wrong when you do.
 *
 * **Loading is not deleted.** `useSelectOptions` returns `[]` until its request
 * lands, so a naive `label ?? "Deleted tag"` tells a merchant with eight saved
 * age tags that all eight are gone, every time the panel opens on a cold cache.
 * It corrects itself a few hundred milliseconds later, which makes it exactly
 * the kind of bug that never survives long enough to be reported and never
 * stops happening either.
 *
 * A warm cache hides it completely, so this pins it rather than relying on
 * anyone catching it in a browser.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { TagRowConfig } from "@/components/ecommerce/customize/tag-row-config";
import { server } from "@/tests/mocks/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const renderPanel = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TagRowConfig
        config={{ key: "age", tagIds: ["t1", "gone"] }}
        onChange={() => {}}
      />
    </QueryClientProvider>,
  );
};

describe("TagRowConfig", () => {
  it("does not call saved tags deleted while the list is still loading", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(`${API}/tags`, async () => {
        await gate;
        return HttpResponse.json({
          data: { items: [{ _id: "t1", name: "0-3M" }] },
        });
      }),
    );

    renderPanel();

    // Mid-flight: nothing is claimed about either id, and the picker says so.
    expect(screen.queryByText("Deleted tag")).not.toBeInTheDocument();
    expect(screen.getByText("Loading tags…")).toBeInTheDocument();

    release();

    // Resolved: the real name for the tag that exists, and only now the
    // "deleted" verdict for the one that genuinely does not.
    await waitFor(() => expect(screen.getByText("0-3M")).toBeInTheDocument());
    expect(screen.getByText("Deleted tag")).toBeInTheDocument();
    expect(screen.getByText("Add a tag…")).toBeInTheDocument();
  });
});
