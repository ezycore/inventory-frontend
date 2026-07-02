/** Square brand chip showing the store's initial — used in the header + footer. */
export function LogoMark({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? 9 : 7,
        background: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--on-primary)",
        fontWeight: 700,
        fontSize: size > 32 ? 18 : 14,
        flex: "none",
      }}
    >
      {(name || "S").charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Store brand lockup for the header/footer: renders the uploaded logo image when
 * one is set (height-constrained, aspect-preserved), otherwise the initial chip
 * next to the store name (with an optional tagline line).
 */
export function Brand({
  name,
  logo,
  markSize = 38,
  nameSize = 18,
  tagline,
}: {
  name: string;
  logo?: string;
  markSize?: number;
  nameSize?: number;
  tagline?: string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        style={{
          height: markSize + 4,
          width: "auto",
          maxWidth: markSize * 4,
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark name={name} size={markSize} />
      {tagline !== undefined ? (
        <span>
          <span style={{ display: "block", fontWeight: 700, fontSize: nameSize, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {name}
          </span>
          {tagline ? (
            <span style={{ display: "block", fontSize: 10, color: "var(--faint)", letterSpacing: "0.08em", marginTop: 2 }}>
              {tagline}
            </span>
          ) : null}
        </span>
      ) : (
        <span style={{ fontWeight: 700, fontSize: nameSize, letterSpacing: "-0.02em" }}>
          {name}
        </span>
      )}
    </span>
  );
}
