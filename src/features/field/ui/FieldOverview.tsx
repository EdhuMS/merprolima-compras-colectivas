import { ArrowRight, ClipboardList, ShoppingBasket, Users } from "lucide-react";
import { BrandLogo } from "../../../shared/ui/BrandLogo";
import { Button } from "../../../components/ui/button";

export function FieldOverview({ onPilot }: { onPilot: () => void }) {
  return (
    <div className="landing">
      <header className="landing-header">
        <BrandLogo />
        <span className="muted text-sm">Merprolima · Los Olivos</span>
      </header>
      <main className="landing-content">
        <section className="landing-hero">
          <div>
            <h1>Compra en conjunto con otros puestos de tu mercado</h1>
            <p className="landing-description">
              Registra lo que necesitas, revisa las compras abiertas y elige
              cuántos sacos pedir.
            </p>
            <div className="landing-actions">
              <Button onClick={onPilot}>
                Iniciar sesión <ArrowRight size={18} />
              </Button>
            </div>
          </div>
          <section className="landing-illustration" aria-labelledby="landing-flow">
            <h2 id="landing-flow">Cómo funciona</h2>
            <ul className="landing-flow">
              <li><ClipboardList aria-hidden="true" /> Registra tu reposición</li>
              <li><Users aria-hidden="true" /> Revisa las propuestas del mercado</li>
              <li><ShoppingBasket aria-hidden="true" /> Súmate a una compra colectiva</li>
            </ul>
          </section>
        </section>
      </main>
    </div>
  );
}
