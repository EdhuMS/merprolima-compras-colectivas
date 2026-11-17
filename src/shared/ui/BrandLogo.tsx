export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={compact ? "sumabasto-logo sumabasto-logo-sidebar" : "sumabasto-logo"}
      src="/brand/sumabasto-logo-claro.png"
      alt="Sumabasto"
      width="1200"
      height="225"
    />
  );
}
