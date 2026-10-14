export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <img className={compact ? "sumabasto-logo sumabasto-logo-sidebar" : "sumabasto-logo"} src="/brand/sumabasto-logo.png" alt="Sumabasto" width="520" height="100" />;
}
