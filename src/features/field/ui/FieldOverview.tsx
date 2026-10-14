import { BrandLogo } from "../../../shared/ui/BrandLogo";
import {
  ArrowRight,
  ShoppingBasket,
  Wheat,
  Leaf,
  Users,
  ClipboardList,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
export function FieldOverview({
  onPilot,
  onTest,
}: {
  onPilot: () => void;
  onTest: () => void;
}) {
  return (
    <div className="landing">
      <header className="landing-header">
        <a href="#" className="landing-brand">
          <BrandLogo />
        </a>
        <Button variant="outline" onClick={onPilot}>
          Ingresar a mi cuenta
        </Button>
      </header>
      <main className="landing-content">
        <section className="landing-hero">
          <div>
            <p className="eyebrow">MERCADO DE PRODUCTORES · LOS OLIVOS</p>
            <h1>Las compras de tu puesto, mejor coordinadas.</h1>
            <p className="landing-description">
              Reúne necesidades con otros puestos, compara el costo de
              abastecimiento y organiza la reposición en un solo lugar.
            </p>
            <div className="landing-actions">
              <Button onClick={onPilot}>
                Ingresar a la plataforma <ArrowRight size={18} />
              </Button>
              <Button variant="ghost" onClick={onTest}>
                Explorar plataforma
              </Button>
            </div>
            <div className="landing-detail">
              <ShieldCheck size={18} />
              <span>
                Acceso por puesto · Entrega o recojo · Condiciones claras
              </span>
            </div>
          </div>
          <div className="landing-illustration">
            <div className="illustration-heading">
              <span className="product-icon">
                <ShoppingBasket size={25} />
              </span>
              <div>
                <p className="eyebrow">TU MERCADO</p>
                <h2>Abastecimiento compartido</h2>
              </div>
            </div>
            <div className="landing-products">
              <div>
                <Wheat size={45} />
                <strong>Arroz</strong>
                <span>Marca y presentación</span>
              </div>
              <div>
                <Leaf size={45} />
                <strong>Azúcar</strong>
                <span>Marca y presentación</span>
              </div>
            </div>
            <div className="illustration-flow">
              <Users size={20} />
              <span>Necesidades compatibles</span>
              <ArrowRight size={18} />
              <ShoppingBasket size={21} />
            </div>
            <p className="muted text-sm">
              Producto, cantidad, fecha y modalidad en una misma propuesta.
            </p>
          </div>
        </section>
        <section className="landing-features" aria-label="Cómo funciona">
          <article>
            <ClipboardList size={24} />
            <h2>Organiza tu reposición</h2>
            <p>
              Registra qué necesitas y ajusta cantidades conforme se vende cada
              marca.
            </p>
          </article>
          <article>
            <Users size={24} />
            <h2>Reúne volumen</h2>
            <p>
              Encuentra necesidades que comparten producto, fecha y forma de
              recepción.
            </p>
          </article>
          <article>
            <Truck size={24} />
            <h2>Compara y participa</h2>
            <p>
              Revisa precios, transporte y reparto antes de decidir sobre la
              propuesta.
            </p>
          </article>
        </section>
      </main>
      <footer className="landing-footer">
        <strong>Sumabasto · Compras colectivas</strong>
        <span>Coordinación entre puestos de abarrotes</span>
      </footer>
    </div>
  );
}
