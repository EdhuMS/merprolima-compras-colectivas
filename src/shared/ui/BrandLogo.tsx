export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={compact ? "sumabasto-logo sumabasto-logo-sidebar" : "sumabasto-logo"}
      src={compact ? "/brand/sumabasto-logo-dark.png" : "/brand/sumabasto-logo-light.png"}
      alt="Sumabasto"
      width="1200"
      height="240"
    />
  );
}
