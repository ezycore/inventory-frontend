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
