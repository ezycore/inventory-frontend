// coding-standard: maintained
/**
 * `CategoryRowConfig` — the card-shape control, and specifically what it writes.
 *
 * The interesting half is not "the merchant pressed split", it is what happens
 * on the way BACK. `stacked` is the fallback `resolveCardShape` applies to a row
 * that has never been asked, so storing the string would put that row outside
 * any future change to what the default means — and on a row holding nothing
 * else, it would leave a saved config entry recording a merchant deciding
 * nothing. Both are invisible in the UI and only observable here.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryRowConfig } from "@/components/ecommerce/customize/category-row-config";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import type { StoreSectionConfig } from "@/lib/storefront-client";

const COLLECTIONS = [
  { _id: "a", name: "Cushion", isListed: true, hasImage: true, description: "" },
  {
    _id: "b",
    name: "Floormat",
    isListed: true,
    hasImage: true,
    description: "Non-slip mats for every door",
  },
] as unknown as CollectionRowValue[];

/* The panel uploads card pictures, so it holds a mutation and needs a client
   even though nothing here resolves one. */
const renderPanel = (config?: StoreSectionConfig) => {
  const onChange = vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CategoryRowConfig
        config={config}
        collections={COLLECTIONS}
        onChange={onChange}
      />
    </QueryClientProvider>,
  );
  return onChange;
};

const press = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

/* The copy on the card comes from the COLLECTION, and it is written two screens
   away under Catalog → Collections. A merchant looking at a short card cannot
   know that; the panel counts the silent ones rather than leaving the block to
   read as broken. Counted against what is on SCREEN, so an unpicked row falls
   back to the same first two the section itself draws. */
describe("CategoryRowConfig — missing descriptions", () => {
  it("counts the picked cards that have no line written", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    expect(
      screen.getByText(/these cards show a name and a button only/i),
    ).toBeInTheDocument();
  });

  it("says nothing once every picked card has one", () => {
    renderPanel({ key: "k", categoryIds: ["b"] });
    expect(
      screen.queryByText(/a name and a button only/i),
    ).not.toBeInTheDocument();
  });

  it("counts the fallback cards when nothing is picked", () => {
    renderPanel();
    expect(screen.getByText(/1 of these cards/i)).toBeInTheDocument();
  });
});

describe("CategoryRowConfig — card shape", () => {
  it("shows the stacked card as chosen when nothing is saved", () => {
    renderPanel();
    expect(
      screen.getByRole("button", { name: "Card shape: Photo on top" }),
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Card shape: Photo beside" }),
    ).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("writes the split shape", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    press("Card shape: Photo beside");
    expect(onChange).toHaveBeenCalledWith({ cardShape: "split" });
  });

  // Not `{ cardShape: "stacked" }`: the row goes back to having no answer, so
  // it keeps following whatever the default is.
  it("clears the field rather than storing the default", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
    });
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith({ cardShape: undefined });
  });

  // Same rule the collection picker follows when its last pick is removed.
  it("drops the whole config when the shape was the only thing on the row", () => {
    const onChange = renderPanel({ key: "k", cardShape: "split" });
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("keeps the config when a heading survives the clear", () => {
    const onChange = renderPanel({
      key: "k",
      title: "Shop by room",
      cardShape: "split",
    });
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith({ cardShape: undefined });
  });

  // The shape is a look, not a pick — a merchant may set it before curating,
  // and the section still renders its fallback collections meanwhile.
  it("can be set on a row with no picks yet", () => {
    const onChange = renderPanel();
    press("Card shape: Photo beside");
    expect(onChange).toHaveBeenCalledWith({ cardShape: "split" });
  });

  /* The hint follows the CHOICE, because the two shapes now do different things
     on a phone — a thumbnail beside the words, or a full-width picture above
     them. It used to say the phone ignored the setting, which was true and was
     reported as a bug anyway; a hint that names what will change is the only
     kind worth pinning. */
  it("says what a phone does with the stacked card", () => {
    renderPanel();
    expect(screen.getByText(/full width above the words/i)).toBeInTheDocument();
  });

  it("says what a phone does with the split card", () => {
    renderPanel({ key: "k", cardShape: "split" });
    expect(
      screen.getByText(/beside the words, two columns/i),
    ).toBeInTheDocument();
  });
});

/* What the panel WRITES for a card, which is the half nothing else observes.
   Two rules carry the feature: a blank card is never stored, and a removed pick
   takes its copy with it — otherwise re-adding a collection later hands the
   merchant a card they think is blank and is not. */
describe("CategoryRowConfig — card overrides", () => {
  const openCard = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name: `Edit the ${name} card` }));

  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it("writes a card's own title against its collection id", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    openCard("Cushion");
    type("Card title for Cushion", "Winter cushions");
    expect(onChange).toHaveBeenCalledWith({
      cards: [{ categoryId: "a", title: "Winter cushions" }],
    });
  });

  // Typing and clearing is not the same as never typing: the entry goes.
  it("drops a card left with nothing on it", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cards: [{ categoryId: "a", title: "Winter cushions" }],
    });
    openCard("Cushion");
    type("Card title for Cushion", "");
    expect(onChange).toHaveBeenCalledWith({ cards: undefined });
  });

  it("keeps other cards when one is written", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a", "b"],
      cards: [{ categoryId: "b", title: "Mats" }],
    });
    openCard("Cushion");
    type("Card title for Cushion", "Cushions");
    expect(onChange).toHaveBeenCalledWith({
      cards: [
        { categoryId: "b", title: "Mats" },
        { categoryId: "a", title: "Cushions" },
      ],
    });
  });

  it("removes a card's copy with the card", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a", "b"],
      cards: [{ categoryId: "a", title: "Cushions" }],
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove Cushion" }));
    expect(onChange).toHaveBeenCalledWith({
      categoryIds: ["b"],
      cards: undefined,
    });
  });

  /* ⚠ The row must SAY it opens. Shipped as a name plus a chevron and was read
     as a plain list item — the fields behind it were reported as missing. */
  it("names what opening a card reveals", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    expect(screen.getByText("Edit card")).toBeInTheDocument();
    expect(
      screen.getByText(/its own title, description, picture and button/i),
    ).toBeInTheDocument();
  });

  it("shows every card field once a card is open", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    openCard("Cushion");
    expect(screen.getByLabelText("Card title for Cushion")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Card description for Cushion"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Button label for Cushion")).toBeInTheDocument();
    expect(screen.getByLabelText("Link for Cushion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  // A card with its own line is described, whatever its collection says.
  it("stops counting a card once it has its own description", () => {
    renderPanel({
      key: "k",
      categoryIds: ["a"],
      cards: [{ categoryId: "a", description: "Soft and bright" }],
    });
    expect(
      screen.queryByText(/a name and a button only/i),
    ).not.toBeInTheDocument();
  });
});

describe("CategoryRowConfig — row composition", () => {
  const press = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name }));

  /* Unset is a real answer: the built-in shape differs by composition and by
     screen, so storing a literal would freeze a phone at a desktop shape. */
  it("writes a chosen picture shape and clears back to automatic", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    press("Picture shape: 1:1");
    expect(onChange).toHaveBeenCalledWith({ cardRatio: "1:1" });
    press("Picture shape: Auto");
    expect(onChange).toHaveBeenCalledWith({ cardRatio: undefined });
  });

  /* ⚠ Side and width only mean something once the picture is BESIDE the words.
     A stacked card has no side to sit on and no column to widen, so the controls
     are absent rather than dead. */
  it("offers the picture side only for the split card", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    expect(screen.queryByText("Picture side")).not.toBeInTheDocument();
    expect(screen.queryByText("Picture width")).not.toBeInTheDocument();
  });

  /* **The swap, which is what the control was asked for.** It shipped as a
     boolean called `cardAlternate` offering only the zebra, and a merchant who
     wanted their picture on the right had no way to say so — the switch read as
     broken rather than as a different feature. The zebra survives as one of the
     three values. */
  it("writes the picture side on a split row", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
    });
    press("Picture side: Right");
    expect(onChange).toHaveBeenCalledWith({ cardSide: "right" });
    press("Picture side: Alternate");
    expect(onChange).toHaveBeenCalledWith({ cardSide: "alternate" });
    // `left` is the default, so choosing it stores nothing.
    press("Picture side: Left");
    expect(onChange).toHaveBeenCalledWith({ cardSide: undefined });
  });

  it("writes the picture's share of the card, and takes it back", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
    });
    press("Picture width: 65%");
    expect(onChange).toHaveBeenCalledWith({ cardSplit: 65 });
    press("Picture width: Auto");
    expect(onChange).toHaveBeenCalledWith({ cardSplit: undefined });
  });

  /* The picture takes the whole card. The name does not vanish with the words —
     it becomes the card's accessible name on the storefront. */
  it("writes the words off, and refuses to store the default", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    fireEvent.click(screen.getByLabelText(/hide the words/i));
    expect(onChange).toHaveBeenCalledWith({ cardHideText: true });
  });

  /* The whole card has always been the anchor, so switching the button off
     costs the shopper no destination — which is why it can be a plain switch. */
  it("writes the button off", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    fireEvent.click(screen.getByLabelText(/show the button/i));
    expect(onChange).toHaveBeenCalledWith({ showCta: false });
  });

  it("writes full width", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    fireEvent.click(screen.getByLabelText(/span the window/i));
    expect(onChange).toHaveBeenCalledWith({ fullWidth: true });
  });
});

/**
 * The Desktop / Phone tabs.
 *
 * Half of these settings do not travel — 65% of a desktop card is a generous
 * picture, 65% of a 390px phone leaves the words in a gutter — and half of them
 * do, which is why the picture's own shape and the row's width are asked once
 * outside the tabs. What the tabs have to get right is inheritance: the phone
 * follows the desktop until a merchant says otherwise, and the panel has to say
 * so rather than leave them to discover it.
 */
describe("CategoryRowConfig — desktop and phone", () => {
  const tab = (name: "Desktop" | "Phone") =>
    fireEvent.click(screen.getByRole("button", { name }));

  it("says the phone is following the desktop, and offers no dead controls", () => {
    renderPanel({ key: "k", categoryIds: ["a"], cardShape: "split" });
    tab("Phone");
    expect(screen.getByText(/follow the Desktop tab/i)).toBeInTheDocument();
    // The layout chips are absent while it inherits — a control that writes
    // nothing is worse than one that is not there.
    expect(
      screen.queryByRole("button", { name: "Card shape: Photo beside" }),
    ).not.toBeInTheDocument();
  });

  /* Seeded from the desktop rather than from the defaults: a merchant taking
     the phone over is about to adjust the layout they can already see, and
     starting them somewhere else reads as the panel resetting their row. */
  it("seeds the phone from the desktop when it takes over", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
      cardSide: "right",
      cardSplit: 65,
    });
    tab("Phone");
    fireEvent.click(screen.getByLabelText(/Phones use the desktop layout/i));
    /* All four stored explicitly, `false` included. On the phone the block's
       PRESENCE is the "has its own answers" signal, so an omitted field would
       hand that setting straight back to the desktop — which is the opposite of
       what taking the phone over means. */
    expect(onChange).toHaveBeenCalledWith({
      mobile: {
        cardShape: "split",
        cardSide: "right",
        cardSplit: 65,
        cardHideText: false,
        cardFlow: "wrap",
      },
    });
  });

  it("writes a phone answer into the phone block, not over the desktop's", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
      mobile: { cardShape: "split" },
    });
    tab("Phone");
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith({ mobile: { cardShape: "stacked" } });
  });

  it("hands the phone back by dropping the block entirely", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      mobile: { cardShape: "split" },
    });
    tab("Phone");
    fireEvent.click(screen.getByLabelText(/Phones use the desktop layout/i));
    expect(onChange).toHaveBeenCalledWith({ mobile: undefined });
  });
});

/**
 * ⚠ **What the panel must NOT throw away.**
 *
 * The row's config was dropped whenever a clear left it "empty", and "empty"
 * was hand-written as `chosen.length > 0 || config.title` — true of the two
 * settings that existed when it was written. Every setting added afterwards was
 * invisible to it, so clearing one field silently deleted the others.
 */
describe("CategoryRowConfig — the config survives a clear", () => {
  it("keeps full width and the picture shape when the card shape goes back", () => {
    const onChange = renderPanel({
      key: "k",
      cardShape: "split",
      fullWidth: true,
      cardRatio: "1:1",
    });
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith({ cardShape: undefined });
    expect(onChange).not.toHaveBeenCalledWith(null);
  });

  it("keeps them when the last collection is removed too", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      fullWidth: true,
    });
    fireEvent.click(screen.getByLabelText("Remove Cushion"));
    expect(onChange).not.toHaveBeenCalledWith(null);
  });

  /* …but a row that really is back to nothing still goes, which is the half
     that stops the panel storing a record of a merchant deciding nothing. */
  it("still drops a config whose only setting was the one just cleared", () => {
    const onChange = renderPanel({ key: "k", cardShape: "split" });
    press("Card shape: Photo on top");
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

/**
 * The two hints that count what is on screen.
 *
 * They have to agree with each other. The description hint was written
 * card-aware from the start; the picture warning was not, so a merchant who had
 * just uploaded a card picture was still told the collection had none and sent
 * to Collections to fix something they had already fixed.
 */
describe("CategoryRowConfig — hints describe the cards, not the collections", () => {
  it("stops warning once the card carries its own picture", () => {
    const unphotographed = [
      { _id: "a", name: "Cushion", isListed: true, hasImage: false, description: "" },
    ] as unknown as CollectionRowValue[];
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <CategoryRowConfig
          config={{
            key: "k",
            categoryIds: ["a"],
            cards: [{ categoryId: "a", image: { url: "https://cdn/x.jpg" } }],
          } as unknown as StoreSectionConfig}
          collections={unphotographed}
          onChange={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByText(/has no picture/i)).toBeNull();
  });

  /* The per-card editor lives inside the picked list, so with nothing picked
     there is no card to open — and this hint used to say "open a card above" to
     a merchant looking at a panel that had none. */
  it("does not send a merchant to a card that is not there", () => {
    renderPanel();
    expect(screen.queryByText(/Open a card above/i)).toBeNull();
    expect(screen.getByText(/Pick your own collections above/i)).toBeInTheDocument();
  });
});

/**
 * The upload hint, which moves with the row's own settings.
 *
 * ⚠ Also the regression guard for a render loop this introduced.
 * `useImageRatioWarning` compares its `recommended` prop by IDENTITY — it was
 * written for the module-level constants in `RECOMMENDED`, and this panel is
 * the first caller to hand it a computed one. Unmemoised, a fresh object every
 * render made that comparison always true, the hook set state on every render,
 * and React threw "Too many re-renders". These tests render the open card, so
 * they fail outright if the memo goes.
 */
describe("CategoryRowConfig — the picture size it asks for", () => {
  const openCard = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name: `Edit the ${name} card` }));

  it("asks for a wide landscape on a stacked card", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    openCard("Cushion");
    expect(screen.getByText(/Best at 1200 × 675px/)).toBeInTheDocument();
  });

  it("asks for less once the picture only takes a quarter of the card", () => {
    renderPanel({ key: "k", categoryIds: ["a"], cardShape: "split", cardSplit: 25 });
    openCard("Cushion");
    expect(screen.getByText(/Best at 300 × 225px/)).toBeInTheDocument();
  });

  it("asks for a banner strip once a height is set", () => {
    renderPanel({ key: "k", categoryIds: ["a"], cardHeight: 20 });
    openCard("Cushion");
    expect(screen.getByText(/Best at 1200 × 40px/)).toBeInTheDocument();
  });
});

/** The height control itself — the thing a ratio could not say. */
describe("CategoryRowConfig — card height", () => {
  it("writes a height and takes it back", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    const field = screen.getByLabelText(/Card height in pixels on desktop/i);
    fireEvent.change(field, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith({ cardHeight: 20 });
    fireEvent.change(field, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ cardHeight: undefined });
  });

  /* ⚠ **Height is per screen**, and this is why: 200px is a thin band across a
     desktop and a third of a 700px phone, so one shared number was a single
     control quietly doing two different jobs. Reported as "height should be
     different for both mobile and desktop". */
  it("writes the phone's height into the phone block", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardHeight: 200,
      mobile: { cardHeight: 200 },
    } as unknown as StoreSectionConfig);
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    fireEvent.change(screen.getByLabelText(/Card height in pixels on phones/i), {
      target: { value: "60" },
    });
    expect(onChange).toHaveBeenCalledWith({ mobile: { cardHeight: 60 } });
  });
});

/**
 * ⚠ **The Phone tab shows what the phone will actually draw, inheritance
 * included** — not "Auto" with the real value hidden behind it.
 *
 * `resolveBannerLayout` applies the desktop's answer before the panel renders,
 * so a phone that has not been given its own width shows the desktop's
 * percentage as the selected chip. The selection IS the statement, which is why
 * no "same as desktop" wording is needed anywhere in this control.
 */
describe("CategoryRowConfig — the phone tab shows the inherited answer", () => {
  it("selects the width the phone is actually using", () => {
    renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardShape: "split",
      cardSplit: 65,
      mobile: { cardShape: "split" },
    } as unknown as StoreSectionConfig);
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    expect(
      screen.getByRole("button", { name: "Picture width: 65%" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

/**
 * Row style, card count, corners and arrows — the four controls that turn this
 * block from "one fixed design" into something a merchant can shape.
 */
describe("CategoryRowConfig — row style and corners", () => {
  it("writes a side-scrolling row, and drops the default back", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    press("Row style: Side-scroll");
    expect(onChange).toHaveBeenCalledWith({ cardFlow: "scroll" });
    press("Row style: Fit the row");
    expect(onChange).toHaveBeenCalledWith({ cardFlow: undefined });
  });

  it("writes how many cards go across, and takes it back", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    press("Cards per row: 3");
    expect(onChange).toHaveBeenCalledWith({ cardPerRow: 3 });
    press("Cards per row: Auto");
    expect(onChange).toHaveBeenCalledWith({ cardPerRow: undefined });
  });

  it("lets the phone scroll a row the desktop keeps as a grid", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      mobile: { cardFlow: "wrap" },
    } as unknown as StoreSectionConfig);
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    press("Row style: Side-scroll");
    expect(onChange).toHaveBeenCalledWith({ mobile: { cardFlow: "scroll" } });
  });

  /* ⚠ Corners are a BRAND decision, made once in Design → Corners. Empty has to
     keep meaning "follow the shop", or every row silently opts out of the
     theme the day someone gives this a default. */
  it("leaves corners to the shop until the merchant types a number", () => {
    const onChange = renderPanel({ key: "k", categoryIds: ["a"] });
    expect(
      screen.getByText(/Following your shop's corners, set in Design/i),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Card corner radius in pixels/i), {
      target: { value: "0" },
    });
    expect(onChange).toHaveBeenCalledWith({ cardRadius: 0 });
  });

  /* Arrows are a control for something that can only happen on a scrolling
     row, so they are absent on a grid rather than dead. */
  it("offers arrows only once a row scrolls", () => {
    renderPanel({ key: "k", categoryIds: ["a"] });
    expect(screen.queryByLabelText(/paging arrows/i)).not.toBeInTheDocument();
  });

  it("writes the arrows off", () => {
    const onChange = renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardFlow: "scroll",
    } as unknown as StoreSectionConfig);
    fireEvent.click(screen.getByLabelText(/paging arrows/i));
    expect(onChange).toHaveBeenCalledWith({ cardArrows: false });
  });

  /* ⚠ Says where they actually appear. The storefront only draws arrows on
     pointer devices — a phone swipes the track — so a merchant who switches
     them on and sees nothing on their phone would read that as broken. */
  it("says arrows are a computer affordance", () => {
    renderPanel({
      key: "k",
      categoryIds: ["a"],
      cardFlow: "scroll",
    } as unknown as StoreSectionConfig);
    expect(
      screen.getByText(/Phones swipe instead/i),
    ).toBeInTheDocument();
  });
});
