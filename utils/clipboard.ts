// coding-standard: maintained

/**
 * Copy text to the clipboard, with a fallback for insecure contexts.
 *
 * `navigator.clipboard` only exists in a *secure context* — HTTPS, `localhost`,
 * or `127.0.0.1`. Production is always HTTPS, so the modern path is the norm;
 * the fallback exists for LAN testing (`http://192.168.x.x:3000` on a phone),
 * where the API is `undefined` and a direct call throws a TypeError.
 *
 * Rejects when the copy fails, so callers keep their own try/catch and toast.
 */
export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  // Legacy path. `position: fixed` + `opacity: 0` keeps the node invisible and
  // stops the focus jump from scrolling the page.
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    // iOS ignores `select()` on a readonly textarea — it needs an explicit
    // Range plus setSelectionRange, or the selection is empty and the copy
    // silently no-ops.
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    textarea.setSelectionRange(0, value.length);

    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy was rejected by the browser");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
