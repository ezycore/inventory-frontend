// coding-standard: maintained

/**
 * Does a file satisfy an `accept` attribute?
 *
 * Extracted from the `FileUpload` primitive when the gallery row grew a replace
 * control: a replacement never passes through the primitive's own input, so its
 * checks never run on that file, and the one path that bypasses the primitive
 * would have been the one path with no limits.
 *
 * Matches the three forms an `accept` list uses — an exact MIME type
 * (`image/png`), a wildcard group (`image/*`) and an extension (`.webp`) — and
 * an empty or absent list accepts everything, as the attribute does.
 */
export const isFileAccepted = (file: File, accept?: string): boolean => {
  const types = accept
    ?.split(",")
    .map((type) => type.trim())
    .filter(Boolean);
  if (!types?.length) return true;

  const extension = `.${file.name.split(".").pop()}`;

  return types.some(
    (type) =>
      type === file.type ||
      type === extension ||
      (type.includes("/*") && file.type.startsWith(type.replace("/*", "/"))),
  );
};
