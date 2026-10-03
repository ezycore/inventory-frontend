import { describe, expect, it } from "vitest";
import type { FilterField } from "@/types/filter";
import {
  decoderForDefault,
  decoderForField,
  encodeFilterValue,
  readListState,
  writeListState,
  type ListFilters,
  type ListUrlSpec,
} from "@/lib/list-url-state";

const fields: FilterField[] = [
  { name: "search", label: "Search", type: "text" },
  { name: "brandId", label: "Brand", type: "select" },
  { name: "tags", label: "Tags", type: "select", mode: "multiple" },
  { name: "createdAt", label: "Created", type: "date-range" },
  { name: "price", label: "Price", type: "number-range" },
  { name: "active", label: "Active", type: "boolean" },
];

const spec = (overrides: Partial<ListUrlSpec> = {}): ListUrlSpec => ({
  defaults: { page: 1, limit: 10, filters: {} },
  decoders: Object.fromEntries(fields.map((field) => [field.name, decoderForField(field)])),
  limitOptions: [10, 20, 50, 100],
  ...overrides,
});

const read = (query: string, s: ListUrlSpec = spec()) => readListState(new URLSearchParams(query), s);
const write = (state: Parameters<typeof writeListState>[1], query = "", s: ListUrlSpec = spec()) =>
  writeListState(new URLSearchParams(query), state, s).toString();

describe("readListState — filters", () => {
  // A link built elsewhere — a tag row's "N Products" — must land filtered, and a
  // multi-select bound to the raw string rendered with nothing selected while the
  // list was filtered: the filter applied and invisible, clearable only by Reset.
  it("parses a multi-select into an array", () => {
    expect(read("tags=a,b,c").filters.tags).toEqual(["a", "b", "c"]);
    expect(read("tags=only-one").filters.tags).toEqual(["only-one"]);
  });

  it("drops empty segments rather than emitting blank chips", () => {
    expect(read("tags=a,,b,").filters.tags).toEqual(["a", "b"]);
  });

  it("leaves single-mode selects and text as strings", () => {
    const { filters } = read("brandId=b1&search=face");
    expect(filters).toMatchObject({ brandId: "b1", search: "face" });
  });

  it("reads ranges and booleans in their own shapes", () => {
    const { filters } = read("createdAt=2026-09-01,2026-09-30&price=100,500&active=true");
    expect(filters).toEqual({
      createdAt: { from: "2026-09-01", to: "2026-09-30" },
      price: { min: 100, max: 500 },
      active: true,
    });
  });

  it("ignores params that are not this list's", () => {
    expect(read("nonsense=1&returnTo=/x").filters).toEqual({});
  });
});

describe("readListState — page, size, sort", () => {
  it("uses the defaults for an untouched list", () => {
    expect(read("")).toEqual({ page: 1, limit: 10, sortBy: undefined, sortOrder: undefined, filters: {} });
  });

  it("reads page, size and sort", () => {
    expect(read("page=3&limit=50&sort_by=createdAt&sort_order=asc")).toMatchObject({
      page: 3,
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "asc",
    });
  });

  // The table offers 10/20/50/100 and the card view 12/24/48/96, under the same
  // keys: a size the list does not offer is its own default, not a broken select.
  it("falls back to the default size when the URL names one the list does not offer", () => {
    expect(read("limit=12").limit).toBe(10);
  });

  it("refuses a page or size that is not a positive whole number", () => {
    expect(read("page=0&limit=-5")).toMatchObject({ page: 1, limit: 10 });
    expect(read("page=abc").page).toBe(1);
    expect(read("page=2.5").page).toBe(1);
  });

  it("refuses an unknown sort order", () => {
    expect(read("sort_order=sideways").sortOrder).toBeUndefined();
  });
});

describe("writeListState", () => {
  it("writes nothing for the defaults, so an untouched list is its bare path", () => {
    expect(write({ page: 1, limit: 10, filters: {} })).toBe("");
  });

  it("writes what differs from the defaults", () => {
    expect(
      write({ page: 3, limit: 20, sortBy: "name", sortOrder: "desc", filters: { tags: ["a", "b"] } }),
    ).toBe("page=3&limit=20&sort_by=name&sort_order=desc&tags=a%2Cb");
  });

  it("removes a key that is back at its default", () => {
    expect(write({ page: 1, limit: 10, filters: { search: "" } }, "page=4&search=face")).toBe("");
  });

  it("keeps every param that is not this list's", () => {
    expect(write({ page: 2, limit: 10, filters: {} }, "returnTo=%2Forders&page=5")).toBe(
      "returnTo=%2Forders&page=2",
    );
  });

  it("round-trips every filter shape", () => {
    const state = {
      page: 2,
      limit: 50,
      filters: {
        search: "face wash",
        tags: ["a", "b"],
        createdAt: { from: "2026-09-01", to: "2026-09-30" },
        price: { min: 0, max: 900 },
        active: false,
      },
    };
    expect(read(write(state))).toMatchObject(state);
  });

  it("keeps two lists on one screen apart by prefix", () => {
    const orders = spec({ prefix: "o_" });
    const query = write({ page: 3, limit: 10, filters: {} }, "page=7", orders);
    expect(query).toBe("page=7&o_page=3");
    expect(read(query, orders).page).toBe(3);
    expect(read(query).page).toBe(7);
  });
});

describe("filters described by their defaults", () => {
  // Lists without a filter bar (the orders page) declare each filter by its
  // default value, and the value's type decides how it reads back.
  const orders: ListUrlSpec<ListFilters> = {
    defaults: { page: 1, limit: 20, filters: { status: "", courier: "all", minItems: 0, flagged: false } },
    decoders: {
      status: decoderForDefault(""),
      courier: decoderForDefault("all"),
      minItems: decoderForDefault(0),
      flagged: decoderForDefault(false),
    },
  };

  it("reads each by the type of its default", () => {
    expect(readListState(new URLSearchParams("status=pending&minItems=3&flagged=true"), orders).filters)
      .toEqual({ status: "pending", courier: "all", minItems: 3, flagged: true });
  });

  it("omits a filter left at a non-empty default", () => {
    const state = { page: 1, limit: 20, filters: { status: "pending", courier: "all", minItems: 0, flagged: false } };
    expect(writeListState(new URLSearchParams(), state, orders).toString()).toBe("status=pending");
  });
});

describe("encodeFilterValue", () => {
  it("returns null for anything that holds nothing", () => {
    for (const empty of [undefined, null, "", [], { from: "", to: "2026-09-01" }, Number.NaN]) {
      expect(encodeFilterValue(empty as never)).toBeNull();
    }
  });
});
