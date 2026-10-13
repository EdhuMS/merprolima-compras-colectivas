import { useState, type ReactNode } from "react";
import { usePurchases } from "../application/usePurchases";
import type { PurchaseRepository } from "../application/ports";
import { EvidencePanel } from "./EvidencePanel";
import { GroupCard } from "./GroupCard";
import { CatalogManager } from "./CatalogManager";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Package,
  ShoppingBasket,
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  ChevronRight,
  Truck,
  Check,
  Pencil,
  X,
  Download,
  Wheat,
  Leaf,
  Users,
  Clock,
  FlaskConical,
  Menu,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { PurchaseDialogs } from "./PurchaseDialogs";
import { money, cn } from "../../../lib/utils";

import { products as demoProducts, stalls } from "../data/seed";
import {
  groupNeeds,
  comparison,
  signature,
  needSchema,
  quoteSchema,
  type NeedInput,
  type QuoteInput,
  type Need,
  type Group,
} from "../domain/model";
type View = "overview" | "needs" | "groups" | "evidence";
const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
export function App({
  repository,
  mode,
  workspaceKey,
  accountAction,
}: {
  repository: PurchaseRepository;
  mode: "demo" | "pilot";
  workspaceKey: string;
  accountAction: ReactNode;
}) {
  const [view, setView] = useState<View>("overview");
  const [demoStall, setStall] = useState(stalls[0]);
  const [demoRole, setRole] = useState("buyer");
  const [mobile, setMobile] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Need>();
  const [detail, setDetail] = useState<string>();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const { query, mutation: mutate } = usePurchases(repository, workspaceKey);
  const products =
    mode === "demo" ? demoProducts : (query.data?.products ?? []);
  const stall =
    mode === "demo" ? demoStall : (query.data?.identity?.stall ?? "Piloto");
  const role =
    mode === "demo" ? demoRole : (query.data?.identity?.role ?? "buyer");
  const isDemo = mode === "demo";
  const originLabel = isDemo ? "simulados" : "del piloto";
  const form = useForm<NeedInput>({
    resolver: zodResolver(needSchema),
    defaultValues: {
      productId: products[0]?.id ?? "",
      qty: 1,
      date: "",
      mode: "delivery",
    },
  });
  const quoteForm = useForm<QuoteInput>({ resolver: zodResolver(quoteSchema) });
  const groups = query.data ? groupNeeds(query.data, products) : [];
  const mine =
    query.data?.needs.filter((n) => n.stall === stall && n.status === "open") ??
    [];
  const selected = groups.find((g) => g.key === detail);
  const cmp = selected ? comparison(selected, stall) : undefined;
  const validGroups = groups.filter(
    (g) => comparison(g, stall).eligible,
  ).length;
  const active =
    query.data?.participations.filter(
      (p) =>
        p.stall === stall &&
        p.status === "confirmed" &&
        groups.some(
          (g) => g.key === p.groupKey && signature(g) === p.signature,
        ),
    ).length ?? 0;
  const openForm = (need?: Need) => {
    setEditing(need);
    form.reset(
      need
        ? {
            productId: need.productId,
            qty: need.qty,
            date: need.date,
            mode: need.mode,
            sourceRef: need.sourceRef ?? "",
          }
        : {
            productId: products[0]?.id ?? "",
            qty: 1,
            date: groups[0]?.date ?? "",
            mode: "delivery",
          },
    );
    setFormOpen(true);
  };
  const openQuote = () => {
    if (!selected) return;
    const q = selected.quote ?? {
      individual: 1,
      collective: 1,
      min: 1,
      transport: 0,
      distribution: 0,
      individualTransport: 0,
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      payment: "",
      supplier: "",
      sourceRef: "",
    };
    quoteForm.reset({
      individual: q.individual,
      collective: q.collective,
      min: q.min,
      transport: q.transport ?? 0,
      distribution: q.distribution ?? 0,
      individualTransport: q.individualTransport ?? 0,
      validUntil: new Date(q.validUntil).toLocaleDateString("en-CA", {
        timeZone: "America/Lima",
      }),
      payment: q.payment,
      sourceRef: q.sourceRef ?? "",
      supplier: q.supplier,
    });
    setQuoteOpen(true);
  };
  const exportData = () => {
    if (!query.data) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...query.data,
            data_origin: isDemo ? "simulated" : query.data.identity?.origin,
            exported_at: new Date().toISOString(),
            note: isDemo
              ? "Datos ficticios. No son entrevistas ni cotizaciones de Merprolima."
              : "Exportación del piloto con agregados de otros puestos y registros propios. La procedencia depende de la captura.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isDemo
      ? "merprolima-demo-simulado.json"
      : "merprolima-piloto.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const status = (g: Group) => {
    const c = comparison(g, stall);
    const p = query.data?.participations.find(
      (p) => p.groupKey === g.key && p.stall === stall,
    );
    return p?.signature === signature(g)
      ? p.status === "confirmed"
        ? "Participación confirmada"
        : "Propuesta rechazada"
      : p
        ? "Requiere nueva confirmación"
        : c.eligible
          ? "Lista para comparar"
          : g.quote && g.total < g.quote.min
            ? "Reuniendo volumen"
            : "Revisar condiciones";
  };
  const nav = [
    { id: "overview", title: "Resumen", icon: LayoutDashboard },
    { id: "needs", title: "Mis necesidades", icon: ClipboardList },
    { id: "groups", title: "Compras colectivas", icon: ShoppingBasket },
    { id: "evidence", title: "Datos y evidencia", icon: ShieldCheck },
  ] as const;
  const card = (g: Group) => (
    <GroupCard
      key={g.key}
      g={g}
      stall={stall}
      status={status}
      onOpen={setDetail}
      isDemo={isDemo}
    />
  );
  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobile && "sidebar-open")}>
        <a href="#" className="brand" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <ShoppingBasket size={24} />
          </span>
          <div>
            <strong>
              merprolima<span className="text-[#c2d785]">.</span>
            </strong>
            <p>COMPRAS COLECTIVAS</p>
          </div>
        </a>
        <div className="market-label">
          <span className="size-2 rounded-full bg-[#b6cb81]" /> Mercado de
          Productores <p>Los Olivos · Lima</p>
        </div>
        <nav className="mt-8 flex flex-col gap-2">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setView(n.id);
                setMobile(false);
              }}
              className={cn("nav-item", view === n.id && "nav-active")}
            >
              <n.icon size={19} />
              {n.title}
              {view === n.id && <ChevronRight className="ml-auto" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="flex gap-3">
            <FlaskConical size={20} className="text-[#c2d785]" />
            <div>
              <strong className="text-sm">
                {isDemo ? "Espacio de demostración" : "Piloto del mercado"}
              </strong>
              <p className="mt-2 text-xs leading-5 text-[#becbc3]">
                {isDemo
                  ? "Explora el flujo con puestos y cotizaciones ficticios."
                  : "Acceso restringido al puesto asignado."}
              </p>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-[#91a79a]">
            APF2 · GRUPO 8 · UTP
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              aria-label="Abrir menú"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <span className="text-sm muted">Tu mercado</span>
            <ChevronRight size={14} className="muted" />
            <strong className="text-sm">Merprolima</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-neutral hidden sm:inline-flex">
              {isDemo ? "Demo · Datos simulados" : "Piloto · Supabase"}
            </span>
            {accountAction}
            <div className="avatar">{role === "buyer" ? "P" : "C"}</div>
          </div>
        </header>
        <main className="page">
          <div className="demo-strip">
            <FlaskConical size={16} />
            <span>
              Estás usando datos simulados. Ningún registro representa una
              compra real.
            </span>
            <button
              onClick={() => setView("evidence")}
              className="ml-auto whitespace-nowrap font-semibold"
            >
              Ver origen <ArrowUpRight className="inline" size={14} />
            </button>
          </div>
          <div className="page-heading">
            <div>
              <p className="eyebrow">ABASTECIMIENTO COMPARTIDO</p>
              <h1>
                {view === "overview"
                  ? "Comprar juntos empieza aquí."
                  : view === "needs"
                    ? "Tus necesidades de compra."
                    : view === "groups"
                      ? "Más volumen, mejores decisiones."
                      : "Datos claros, decisiones honestas."}
              </h1>
              <p className="mt-3 muted">
                {view === "overview"
                  ? "Reúne necesidades, compara condiciones y decide con claridad."
                  : view === "needs"
                    ? "Registra lo que necesitas reponer. Tú decides cuándo participar."
                    : view === "groups"
                      ? "Encuentra propuestas compatibles y revisa el costo completo."
                      : "Conoce qué es simulado y qué falta validar en el mercado."}
              </p>
            </div>
            {view !== "evidence" && (
              <Button
                disabled={!products.length || query.isError}
                onClick={() => openForm()}
              >
                <Plus size={18} /> Nueva necesidad
              </Button>
            )}
          </div>
          {!isDemo && role === "coordinator" && (
            <div className="mb-4">
              <CatalogManager
                repository={repository}
                onSaved={() => query.refetch()}
              />
            </div>
          )}
          <div className="context-bar">
            <label className="flex items-center gap-3 text-sm">
              <span className="muted">
                {isDemo ? "Puesto de prueba" : "Tu puesto"}
              </span>
              <select
                disabled={!isDemo}
                aria-label="Puesto de prueba"
                value={stall}
                onChange={(e) => setStall(e.target.value)}
              >
                {(isDemo ? stalls : [stall]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <span className="muted">Vista</span>
              <select
                disabled={!isDemo}
                aria-label="Rol de demostración"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="buyer">Comprador</option>
                <option value="coordinator">Coordinador</option>
              </select>
            </label>
            <span className="ml-auto hidden md:inline text-xs muted">
              {isDemo
                ? "Estos perfiles no son cuentas reales"
                : "Rol asignado en Supabase"}
            </span>
          </div>
          {(notice || mutate.isError || mutate.isSuccess) && (
            <div role="status" className="notice">
              {notice ||
                mutate.error?.message ||
                "Cambios guardados correctamente."}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {query.isLoading ? (
            <p className="py-12 muted">Cargando datos…</p>
          ) : query.isError ? (
            <div role="alert" className="notice">
              {query.error.message}
              <Button onClick={() => query.refetch()}>Reintentar</Button>
              <Button
                variant="outline"
                disabled={!isDemo}
                onClick={() => setResetOpen(true)}
              >
                Restablecer demo
              </Button>
            </div>
          ) : (
            <>
              {view === "overview" && (
                <>
                  <section className="hero-panel">
                    <div>
                      <span className="hero-tag">
                        <span className="size-1.5 bg-[#d7e8ac] rounded-full" />{" "}
                        COORDINA SIN COMPLICARTE
                      </span>
                      <h2>
                        El mismo mercado.
                        <br />
                        Una compra mejor pensada.
                      </h2>
                      <p>
                        Tu necesidad puede sumar a la de otros puestos.
                        <br className="hidden md:block" /> Revisa producto,
                        volumen y condiciones antes de confirmar.
                      </p>
                      <button
                        onClick={() => setView("groups")}
                        className="hero-link"
                      >
                        Explorar compras colectivas <ArrowRight size={18} />
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="art-circle" />
                      <div className="sack sack-one">
                        <Wheat size={45} />
                        <span>ARROZ</span>
                        <small>49 kg</small>
                      </div>
                      <div className="sack sack-two">
                        <Leaf size={40} />
                        <span>AZÚCAR</span>
                        <small>50 kg</small>
                      </div>
                      <div className="floating-label">
                        <Users size={17} /> El volumen suma
                      </div>
                    </div>
                  </section>
                  <section className="stats">
                    <div>
                      <span className="stat-icon">
                        <ClipboardList size={19} />
                      </span>
                      <p>Mis necesidades activas</p>
                      <strong>{mine.length.toString().padStart(2, "0")}</strong>
                      <small>
                        {isDemo
                          ? "Guardadas en esta demo"
                          : "Persistentes en Supabase"}
                      </small>
                    </div>
                    <div>
                      <span className="stat-icon">
                        <ShoppingBasket size={19} />
                      </span>
                      <p>Propuestas con volumen</p>
                      <strong>{validGroups.toString().padStart(2, "0")}</strong>
                      <small>Revisa el costo total</small>
                    </div>
                    <div>
                      <span className="stat-icon">
                        <Check size={19} />
                      </span>
                      <p>Mis participaciones</p>
                      <strong>{active.toString().padStart(2, "0")}</strong>
                      <small>
                        {isDemo
                          ? "Confirmaciones vigentes de prueba"
                          : "Confirmaciones vigentes"}
                      </small>
                    </div>
                  </section>
                  <div className="section-heading">
                    <div>
                      <h2>Compras en coordinación</h2>
                      <p className="muted text-sm mt-1">
                        Productos compatibles, cantidades visibles.
                      </p>
                    </div>
                    <Button variant="ghost" onClick={() => setView("groups")}>
                      Ver todas <ArrowRight size={16} />
                    </Button>
                  </div>
                  <section className="cards-grid">
                    {groups.slice(0, 3).map(card)}
                  </section>
                  <div className="how-panel">
                    <ShieldCheck size={24} />
                    <div>
                      <h3 className="font-semibold">
                        Primero compara. Después decide.
                      </h3>
                      <p className="muted text-sm mt-1">
                        Registrar una necesidad no confirma una compra. No se
                        procesan pagos en esta aplicación.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {view === "groups" && (
                <>
                  <div className="section-heading">
                    <h2>
                      {groups.length} propuestas{" "}
                      {isDemo ? "de demostración" : "del piloto"}
                    </h2>
                    <span className="text-xs muted">
                      Entrega o recojo compatibles
                    </span>
                  </div>
                  <section className="cards-grid">{groups.map(card)}</section>
                  {!groups.length && (
                    <div className="empty">
                      <ShoppingBasket />
                      <h2>No hay necesidades activas</h2>
                      <p>Registra la primera para iniciar una agrupación.</p>
                      <Button
                        disabled={!products.length || query.isError}
                        onClick={() => openForm()}
                      >
                        Registrar necesidad
                      </Button>
                    </div>
                  )}
                </>
              )}
              {view === "needs" && (
                <section className="white-panel">
                  <div className="section-heading">
                    <h2>Registros de {stall}</h2>
                    <span className="badge badge-neutral">
                      {isDemo ? "Simulados" : "Piloto"}
                    </span>
                  </div>
                  {mine.length ? (
                    <div className="overflow-x-auto">
                      <table>
                        <thead>
                          <tr>
                            <th>Producto y presentación</th>
                            <th>Cantidad</th>
                            <th>Fecha deseada</th>
                            <th>Modalidad</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mine.map((n) => {
                            const p = products.find(
                              (p) => p.id === n.productId,
                            )!;
                            return (
                              <tr key={n.id}>
                                <td>
                                  <strong>{p.name}</strong>
                                  <p className="text-xs muted mt-1">
                                    {p.brand} · {p.kg} kg
                                  </p>
                                </td>
                                <td>{n.qty} sacos</td>
                                <td>{dateLabel(n.date)}</td>
                                <td>
                                  {n.mode === "delivery"
                                    ? "Entrega en mercado"
                                    : "Recojo"}
                                </td>
                                <td>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openForm(n)}
                                    >
                                      <Pencil size={14} />
                                      Editar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={mutate.isPending}
                                      onClick={() =>
                                        mutate.mutate(() =>
                                          repository.withdraw(n.id, stall),
                                        )
                                      }
                                    >
                                      Retirar
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty">
                      <Package />
                      <h2>Tu próxima reposición empieza aquí</h2>
                      <p>
                        Agrega un producto para encontrar necesidades
                        compatibles.
                      </p>
                      <Button
                        disabled={!products.length || query.isError}
                        onClick={() => openForm()}
                      >
                        Nueva necesidad
                      </Button>
                    </div>
                  )}
                  <p className="text-xs muted mt-5">
                    Editar o retirar cambia el volumen del grupo y exige revisar
                    las confirmaciones anteriores.
                  </p>
                </section>
              )}
              {view === "evidence" && (
                <EvidencePanel
                  isDemo={isDemo}
                  exportData={exportData}
                  onReset={() => setResetOpen(true)}
                />
              )}
            </>
          )}
          <footer>
            Proyecto académico · Innovación y Transformación Digital · Grupo 8
            <span>Merprolima / Demo v0.1</span>
          </footer>
        </main>
      </div>
      <PurchaseDialogs
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editing={editing}
        isDemo={isDemo}
        form={form}
        quoteForm={quoteForm}
        mutate={mutate}
        repository={repository}
        stall={stall}
        products={products}
        selected={selected}
        quoteOpen={quoteOpen}
        setQuoteOpen={setQuoteOpen}
        setDetail={setDetail}
        cmp={cmp}
        dateLabel={dateLabel}
        status={status}
        role={role}
        openQuote={openQuote}
        resetOpen={resetOpen}
        setResetOpen={setResetOpen}
        originLabel={originLabel}
      />
    </div>
  );
}
