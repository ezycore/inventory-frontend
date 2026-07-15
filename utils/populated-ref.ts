// coding-standard: maintained
/**
 * A populated Mongoose ref arrives on the wire as `string | <object> | null` — the backend
 * populates it on some reads and leaves a bare id on others (the `maybeRef` DTO helper). This
 * returns the populated object when present, else `undefined`, so a caller can read sub-fields
 * without repeating the `typeof` narrowing at every site.
 */
export function populatedRef<T extends object>(
  ref: string | T | null | undefined,
): T | undefined {
  return ref && typeof ref === "object" ? ref : undefined;
}
