import { navigate, usePathname } from "../../../app/navigation";
import { predictProduct } from "../domain/marketForecast";
import { Recommendations } from "./Recommendations";
import { ServiceForecast, supportsServiceForecast } from "./ServiceForecast";
import { recommendPurchases } from "../domain/recommendations";
import { Modal } from "../../../components/ui/dialog";
import { ProposalComposer } from "./ProposalComposer";
import { BrandLogo } from "../../../shared/ui/BrandLogo";
import {
  WorkspaceSidebar,
  useWorkspaceSidebar,
} from "../../../shared/ui/WorkspaceSidebar";
import { useEffect, useState, type ReactNode } from "react";
import { usePurchases } from "../application/usePurchases";
import type { PurchaseRepository } from "../application/ports";
import { type ExportPeriod } from "../domain/export";
import { printReport } from "../../../lib/printReport";
import { EvidencePanel } from "./EvidencePanel";
import { GroupCard } from "./GroupCard";
import { ParticipationsPanel } from "./ParticipationsPanel";
import { CoordinationPanel } from "./CoordinationPanel";
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
  outstandingDemandGroups,
  comparison,
  signature,
  needSchema,
  quoteSchema,
  type NeedInput,
  type QuoteInput,
  type Need,
  type Group,
} from "../domain/model";
type View =
  | "overview"
  | "needs"
  | "groups"
  | "participations"
  | "catalog"
  | "evidence";
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
  const pathname = usePathname();
  const [demoStall] = useState(stalls[0]);
  const [demoRole] = useState("buyer");
  const navigation = useWorkspaceSidebar();
  const [formOpen, setFormOpen] = useState(false);
  const [needRequestId, setNeedRequestId] = useState<string>();
  const [editing, setEditing] = useState<Need>();
  const [localDetail, setLocalDetail] = useState<string>();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [draft, setDraft] = useState<Group>();
  const [composerOpen, setComposerOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [withdrawing, setWithdrawing] = useState<Need>();
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
  const isCoordinator = role === "coordinator";
  const prefix = isCoordinator ? "/coordinacion" : "/tienda";
  const routes: Partial<Record<View, string>> = {
    overview: "inicio", needs: isCoordinator ? "solicitudes" : "necesidades",
    groups: isCoordinator ? "propuestas" : "compras", evidence: "reportes",
    ...(isCoordinator ? { catalog: "catalogo" } : { participations: "participaciones" }),
  };
  const [, , section, item, ...extra] = pathname.split("/");
  const matched = pathname.startsWith(prefix + "/") && !extra.length
    ? (Object.keys(routes) as View[]).find(key => routes[key] === section && (!item || key === "groups"))
    : undefined;
  const view = matched ?? "overview";
  const href = (section: View) => prefix + "/" + (routes[section] ?? routes.overview);
  const setView = (section: View) => {
    setLocalDetail(undefined);
    navigate(href(section));
  };
  let routeDetail: string | undefined;
  if (matched === "groups" && item) {
    try { routeDetail = decodeURIComponent(item); } catch { /* Invalid link. */ }
  }
  const detail = routeDetail ?? localDetail;
  const setDetail = (key: string | undefined) => {
    setLocalDetail(key);
    if (!key && routeDetail) navigate(href("groups"), true);
  };
  useEffect(() => {
    if (!isDemo && query.data?.identity && (!matched || (item && !routeDetail))) {
      navigate(prefix + "/inicio", true);
    }
  }, [isDemo, query.data?.identity, matched, item, routeDetail, prefix]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setLocalDetail(undefined);
  }, [pathname]);
  const originLabel = "del mercado";
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
  const published = groups.filter((g) => !!g.quote);
  const todayInLima = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const openProposals = published.filter((g) =>
    g.date >= todayInLima && Date.parse(g.quote!.validUntil) > Date.now(),
  );
  const inputs = query.data?.forecastInputs;
  const currentWeek = new Date(todayInLima + "T00:00:00Z");
  currentWeek.setUTCDate(currentWeek.getUTCDate() - (currentWeek.getUTCDay() + 6) % 7);
  const forecastWeek = currentWeek.toISOString().slice(0, 10);
  const [suggestedQuantity, setSuggestedQuantity] = useState(1);
  const recommendations = role === "buyer"
    ? recommendPurchases(openProposals.filter(group => !query.data?.participations.some(
      item => item.groupKey === group.key && item.stall === stall && item.status !== "declined",
    )), query.data?.needs ?? [], stall, todayInLima, inputs)
    : [];
  const openDetail = (key: string, quantity = 1) => {
    setSuggestedQuantity(quantity);
    setLocalDetail(undefined);
    navigate(href("groups") + "/" + encodeURIComponent(key));
  };
  const demandStore = query.data
    ? mode === "pilot" && isCoordinator
      ? { ...query.data, needs: query.data.coordinatorDemand ?? [] }
      : query.data
    : undefined;
  const demand = demandStore
    ? mode === "demo"
      ? outstandingDemandGroups(demandStore, products)
      : groupNeeds(demandStore, products).filter((g) => g.total > 0)
    : [];
  const selected =
    groups.find((g) => g.key === detail) ??
    (draft?.key === detail ? draft : undefined);
  const cmp = selected ? comparison(selected, stall) : undefined;
  const openForm = (need?: Need, suggestion?: { productId: string; quantity: number }) => {
    setEditing(need);
    setNeedRequestId(need?.id ?? crypto.randomUUID());
    mutate.reset();
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
            productId: suggestion?.productId ?? products[0]?.id ?? "",
            qty: suggestion?.quantity ?? 1,
            date: suggestion ? todayInLima : "",
            mode: "delivery",
          },
    );
    setFormOpen(true);
  };
  const openQuote = (group = selected) => {
    if (!group) return;
    const q = group.quote ?? {
      individual: 0,
      collective: 0,
      min: 1,
      transport: null,
      distribution: null,
      individualTransport: null,
      evidenceType:
        isDemo || query.data?.identity?.origin === "simulated"
          ? ("simulated" as const)
          : ("unclassified" as const),
      deliveryEstimate: null,
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      payment: "",
      supplier: "",
      sourceRef: "",
    };
    quoteForm.reset({
      individual: q.individual,
      collective: q.collective,
      min: q.min,
      transport: q.transport,
      distribution: q.distribution,
      individualTransport: q.individualTransport,
      validUntil: new Date(q.validUntil).toLocaleDateString("en-CA", {
        timeZone: "America/Lima",
      }),
      payment: isDemo ? "Por acordar con proveedor" : q.payment,
      sourceRef: q.sourceRef || `APP:QUOTE:${group.key}`,
      supplier: isDemo
        ? q.supplier.replace(" · caso de testers", "")
        : q.supplier,
      evidenceType: q.evidenceType ?? (isDemo ? "simulated" : "unclassified"),
      deliveryEstimate: q.deliveryEstimate ?? null,
    });
    setQuoteOpen(true);
  };
  const activeNeeds = mine.filter(need => need.date >= todayInLima && !groups.some(group =>
    group.needs.some(item => item.id === need.id) && query.data?.participations.some(
      participation => participation.stall === stall && participation.groupKey === group.key &&
        participation.status === "confirmed" && participation.signature === signature(group),
    ),
  ));
  const exportData = (period: ExportPeriod) => {
    if (!query.data) return;
    const inside = (date: string) => date >= period.from && date <= period.to;
    const title = isCoordinator ? "Resumen de abastecimiento del mercado" : "Mis registros de abastecimiento";
    const columns = isCoordinator
      ? ["Producto", "Fecha deseada", "Modalidad", "Sacos solicitados", "Propuesta"]
      : ["Producto", "Fecha deseada", "Modalidad", "Sacos", "Estado"];
    const modeLabel = (mode: string) => mode === "pickup" ? "Recojo" : "Entrega";
    const rows = isCoordinator
      ? groups.filter(group => inside(group.date)).map(group => [
          group.product.name + " " + group.product.brand, group.date, modeLabel(group.mode),
          String(group.total), group.quote ? (openProposals.includes(group) ? "Vigente" : "Fuera de vigencia") : "Sin propuesta",
        ])
      : query.data.needs.filter(need => need.stall === stall && inside(need.date)).map(need => {
          const product = products.find(item => item.id === need.productId);
          const key = [need.origin, need.productId, need.date, need.mode].join("|");
          const group = groups.find(item => item.key === key);
          const participation = query.data?.participations.find(item => item.stall === stall && item.groupKey === key);
          const label = need.status === "withdrawn" ? "Retirada"
            : participation?.status === "confirmed" && group && participation.signature === signature(group)
              ? "Participación confirmada" : need.date < todayInLima ? "Fecha pasada"
                : participation?.status === "pending" ? "Participación pendiente" : "Registrada";
          return [product ? product.name + " " + product.brand : "Producto", need.date, modeLabel(need.mode), String(need.qty), label];
        });
    rows.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0], "es"));
    printReport(title, period.from + " al " + period.to, columns, rows);
  };
  const status = (g: Group) => {
    const c = comparison(g, stall);
    const p = query.data?.participations.find(
      (p) => p.groupKey === g.key && p.stall === stall,
    );
    return p?.signature === signature(g)
      ? p.status === "confirmed"
        ? "Participación confirmada"
        : p.status === "pending"
          ? "Pedido pendiente de confirmación"
          : "Sin participación"
      : p?.status === "declined"
        ? "Sin participación"
        : p
          ? "Requiere nueva confirmación"
          : c.eligible
            ? "Lista para comparar"
            : g.quote && g.total < g.quote.min
              ? "Reuniendo volumen"
              : "Revisar condiciones";
  };
  const nav: { id: View; title: string; icon: typeof LayoutDashboard }[] =
    isCoordinator
      ? [
          {
            id: "overview",
            title: "Inicio",
            icon: LayoutDashboard,
          },
          { id: "needs", title: "Solicitudes", icon: ClipboardList },
          { id: "groups", title: "Propuestas", icon: ShoppingBasket },
          { id: "catalog", title: "Catálogo", icon: Package },
          { id: "evidence", title: "Reportes del mercado", icon: ShieldCheck },
        ]
      : [
          { id: "overview", title: "Inicio", icon: LayoutDashboard },
          { id: "needs", title: "Mis necesidades", icon: ClipboardList },
          { id: "groups", title: "Compras colectivas", icon: ShoppingBasket },
          { id: "participations", title: "Mis participaciones", icon: Check },
          { id: "evidence", title: "Mis reportes", icon: ShieldCheck },
        ];
  const headings: Record<View, [string, string]> = {
    overview: isCoordinator
      ? [
          "Panel de coordinación.",
          "Organiza el abastecimiento y mantén las propuestas del mercado al día.",
        ]
      : [
          "Mi puesto",
          "Reúne necesidades, compara condiciones y decide con claridad.",
        ],
    needs: [
      isCoordinator ? "Necesidades recibidas." : "Tus necesidades de compra.",
      isCoordinator
        ? "Revisa la demanda de los clientes y prepara propuestas compatibles."
        : "Registra lo que necesitas reponer. Coordinación revisará tu solicitud.",
    ],
    groups: isCoordinator
      ? [
          "Gestionar compras.",
          "Revisa el volumen y administra las cotizaciones de cada agrupación.",
        ]
      : [
          "Más volumen, mejores decisiones.",
          "Encuentra propuestas compatibles y revisa el costo completo.",
        ],
    participations: [
      "Tus participaciones de compra.",
      "Consulta lo que confirmaste, revisa los cambios o retira tu participación.",
    ],
    catalog: [
      "Catálogo de productos.",
      "Administra las marcas y presentaciones disponibles para el mercado.",
    ],
    evidence: [
      isCoordinator
        ? "Reportes del mercado."
        : "Mis reportes de abastecimiento.",
      "Consulta los registros y descarga el resumen del periodo.",
    ],
  };
  const card = (g: Group) => (
    <GroupCard
      key={g.key}
      g={g}
      stall={stall}
      status={status}
      onOpen={openDetail}
      isDemo={isDemo}
      management={isCoordinator}
    />
  );
  if (!isDemo && !query.data?.identity) {
    return (
      <main className="loading-screen">
        <BrandLogo />
        <p role="status">
          {query.isError
            ? "No se pudo verificar tu acceso al mercado."
            : "Verificando tu acceso al mercado…"}
        </p>
        {query.isError && accountAction}
      </main>
    );
  }

  return (
    <div
      className={cn(
        "app-shell market-workspace",
        !navigation.isMobile &&
          !navigation.desktopVisible &&
          "sidebar-collapsed",
      )}
    >
      <WorkspaceSidebar navigation={navigation}>
        <a
          href="#"
          className="brand"
          aria-label="Sumabasto · Inicio"
          onClick={(e) => {
            e.preventDefault();
            setView("overview");
            if (navigation.isMobile) navigation.close();
          }}
        >
          <span className="sidebar-wordmark"><BrandLogo compact /></span>
          <img className="sidebar-mark" src="/brand/sumabasto-bolsas.png" alt="" width={36} height={36} />
        </a>

        <nav aria-label="Secciones de Sumabasto" className="workspace-links flex flex-col gap-2">
          {nav.map((n) => (
            <a
              key={n.id}
              href={href(n.id)}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                setView(n.id);
                if (navigation.isMobile) navigation.close();
              }}
              aria-current={view === n.id ? "page" : undefined}
              aria-label={n.title}
              title={n.title}
              className={cn("nav-item", view === n.id && "nav-active")}
            >
              <n.icon size={19} aria-hidden="true" />
              <span className="nav-label">{n.title}</span>
              {view === n.id && <ChevronRight className="nav-chevron ml-auto" size={15} />}
            </a>
          ))}
        </nav>
      </WorkspaceSidebar>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              ref={navigation.toggleRef}
              className="sidebar-toggle mobile-sidebar-toggle"
              aria-label={
                navigation.expanded
                  ? "Contraer navegación"
                  : "Expandir navegación"
              }
              aria-expanded={navigation.expanded}
              aria-controls="workspace-navigation"
              onClick={navigation.toggle}
            >
              <Menu />
            </button>
            <strong className="text-sm">Merprolima</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-neutral hidden sm:inline-flex">
              {role === "coordinator" ? "Coordinación" : "Mi puesto"}
            </span>
            {accountAction}

          </div>
        </header>
        {!isCoordinator && (
          <nav aria-label="Accesos de mi puesto" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[#dce7dc] bg-white px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:hidden">
            {nav.filter(item => item.id !== "evidence").map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                aria-current={view === item.id ? "page" : undefined}
                className={cn("grid min-h-11 min-w-14 place-items-center rounded-lg px-1 text-[11px]", view === item.id && "bg-[#e9f3e9] font-semibold text-[#24533c]")}>
                <item.icon size={19} aria-hidden="true" />
                {item.id === "overview" ? "Inicio" : item.id === "needs" ? "Necesidades" : item.id === "groups" ? "Compras" : "Participación"}
              </button>
            ))}
          </nav>
        )}
        <main className={cn("page", !isCoordinator && "max-sm:!pb-24")}>
          <div className="page-heading">
            <div>
              <h1>{headings[view][0].replace(/\.$/, "")}</h1>
              <p className="mt-2 text-sm muted">{view === "overview"
                ? isCoordinator ? "Solicitudes y propuestas de tu mercado" : stall
                : headings[view][1]}</p>
            </div>
            {!isCoordinator && view === "needs" && (
              <Button
                disabled={!products.length || query.isError}
                onClick={() => openForm()}
              >
                <Plus size={18} /> Nueva necesidad
              </Button>
            )}
            {isCoordinator &&
              ["groups", "needs"].includes(view) && (
                <Button
                  disabled={!products.length || query.isError}
                  onClick={() => setComposerOpen(true)}
                >
                  <Plus size={18} />
                  Crear compra colectiva
                </Button>
              )}
          </div>
          {view === "catalog" && isCoordinator && (
            <div className="mb-4">
              <CatalogManager
                repository={repository}
                onSaved={() => {
                  query.refetch();
                  setSuccess("Producto agregado al catálogo correctamente.");
                }}
              />
            </div>
          )}
          {(notice || mutate.isError) && (
            <div role="status" className="notice">
              {notice ||
                mutate.error?.message ||
                "Cambios guardados correctamente."}
              <button
                aria-label="Cerrar aviso"
                onClick={() => {
                  setNotice("");
                  mutate.reset();
                }}
              >
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
                Reiniciar espacio
              </Button>
            </div>
          ) : (
            <>
              {view === "overview" && (
                <div className="grid gap-6">
                  {isCoordinator ? (
                    <section className="white-panel">
                      <h2 className="text-xl font-semibold">Solicitudes del mercado</h2>
                      <p className="mt-2 text-sm muted">Consulta las cantidades registradas y el pronóstico semanal en una sola bandeja.</p>
                      <Button className="mt-4" onClick={() => setView("needs")}>Ver solicitudes</Button>
                    </section>
                  ) : (
                    <Recommendations items={recommendations} onOpen={openDetail}
                      onRegister={() => openForm()}
                      shortages={products.flatMap(product => {
                        if (openProposals.some(group => group.product.id === product.id) ||
                          mine.some(need => need.productId === product.id && need.date >= todayInLima)) return [];
                        const row = inputs?.find(input => input.productId === product.id && input.week === forecastWeek);
                        const estimate = row ? predictProduct(product, row) : undefined;
                        return estimate !== undefined && estimate >= 1
                          ? [{ product, quantity: Math.round(estimate) }] : [];
                      })}
                      onRegisterSuggested={(productId, quantity) => openForm(undefined, { productId, quantity })} />
                  )}
                  {!isCoordinator && import.meta.env.VITE_FORECAST_API_URL && (
                    <section className="white-panel" aria-labelledby="weekly-forecast">
                      <h2 id="weekly-forecast" className="text-xl font-semibold">Pronóstico semanal</h2>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {products.filter(supportsServiceForecast).map(product => (
                          <div key={product.id + forecastWeek}>
                            <h3 className="font-semibold">{product.name} {product.brand} · {product.kg} kg</h3>
                            {inputs?.some(input => input.productId === product.id && input.week === forecastWeek)
                              ? <ServiceForecast product={product} week={forecastWeek} />
                              : <p className="text-sm muted">Aún falta historial semanal para este producto.</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <section aria-labelledby="open-purchases">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 id="open-purchases" className="text-lg font-semibold">
                        {isCoordinator ? "Propuestas vigentes" : "Compras abiertas"}
                      </h2>
                      <Button variant="ghost" onClick={() => setView("groups")}>Ver compras</Button>
                    </div>
                    {openProposals.length ? (
                      <div className="cards-grid">{openProposals.slice(0, 3).map(card)}</div>
                    ) : <p className="muted text-sm">No hay compras abiertas en este momento.</p>}
                  </section>
                </div>
              )}
              {view === "groups" && (
                <>
                  <div className="section-heading">
                    <h2>{openProposals.length} compras vigentes</h2>
                    <span className="text-xs muted">
                      Entrega o recojo compatibles
                    </span>
                  </div>
                  <section className="cards-grid">
                    {openProposals.map(card)}
                  </section>
                  {!openProposals.length && (
                    <div className="empty">
                      <ShoppingBasket />
                      <h2>No hay compras vigentes</h2>
                      <p>
                        {isCoordinator
                          ? "Revisa las necesidades recibidas o crea una nueva propuesta."
                          : "Las propuestas aparecerán cuando coordinación publique una compra colectiva."}
                      </p>
                      {isCoordinator && (
                        <Button onClick={() => setView("needs")}>
                          Ver necesidades recibidas
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
              {view === "catalog" && isCoordinator && (
                <section className="white-panel">
                  <h2 className="text-lg font-semibold mb-5">
                    {products.length} productos disponibles
                  </h2>
                  <div className="grid gap-4">
                    {products.map((p) => (
                      <article
                        key={p.id}
                        className="border-b border-[#e8ece7] pb-4"
                      >
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="muted text-sm">
                          {p.category} · {p.brand} · Saco de {p.kg} kg
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {view === "participations" && (
                <ParticipationsPanel
                  participations={query.data?.participations ?? []}
                  groups={groups}
                  products={products}
                  today={todayInLima}
                  stall={stall}
                  onOpen={openDetail}
                  onBrowse={() => setView("groups")}
                />
              )}
              {view === "needs" && isCoordinator && (
                <CoordinationPanel groups={demand.filter(group => group.date >= todayInLima)}
                      inputs={inputs ?? []}
                      products={products}
                      today={todayInLima}
                      forecastUnavailable={query.data?.forecastUnavailable}
                      onPrepare={(product, pendingGroup) => {
                        const origin = query.data?.identity?.origin ?? "simulated";
                        const date = pendingGroup?.date ?? todayInLima;
                        const key = pendingGroup?.key ?? [origin, product.id, date, "delivery"].join("|");
                        const group: Group = groups.find(item => item.key === key) ?? pendingGroup ?? {
                          key, product, date, mode: "delivery", origin, needs: [], total: 0,
                        };
                        setDraft(group);
                        setDetail(key);
                        openQuote(group);
                      }}
                      />
              )}
              {view === "needs" && !isCoordinator && (
                <section className="white-panel">
                  <div className="section-heading">
                    <h2>
                      Necesidades de{" "}
                      {stall === "COORD-G8"
                        ? "Coordinación"
                        : stall.replace("TESTER-", "Puesto ")}
                    </h2>
                    <span className="badge badge-neutral">Activas</span>
                  </div>
                  {activeNeeds.length ? (
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
                          {activeNeeds.map((n) => {
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
                                <td>{n.qty} unidades</td>
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
                                      onClick={() => {
                                        mutate.reset();
                                        setWithdrawing(n);
                                      }}
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
                  isCoordinator={isCoordinator}
                  onReset={() => setResetOpen(true)}
                />
              )}
            </>
          )}
          <footer>
            Sumabasto · Compras colectivas
            <span>Abastecimiento compartido</span>
          </footer>
        </main>
      </div>
      <PurchaseDialogs
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editing={editing}
        needRequestId={needRequestId}
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
        suggestedQuantity={suggestedQuantity}
        cmp={cmp}
        dateLabel={dateLabel}
        status={status}
        role={role}
        openQuote={() => openQuote()}
        resetOpen={resetOpen}
        setResetOpen={setResetOpen}
        originLabel={originLabel}
        simulatedOrigin={isDemo || query.data?.identity?.origin === "simulated"}
        onSuccess={setSuccess}
      />
      {isCoordinator && (
        <ProposalComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          products={products}
          origin={query.data?.identity?.origin ?? "simulated"}
          onContinue={(group) => {
            setDraft(group);
            setDetail(group.key);
            openQuote(groups.find((g) => g.key === group.key) ?? group);
          }}
        />
      )}
      <Modal
        open={!!success}
        onOpenChange={(open) => !open && setSuccess("")}
        title="Operación completada"
        description={success}
      >
        <div className="flex justify-end mt-6">
          <Button onClick={() => setSuccess("")}>Entendido</Button>
        </div>
      </Modal>
      <Modal
        open={!!withdrawing}
        onOpenChange={(open) => {
          if (!open && !mutate.isPending) setWithdrawing(undefined);
        }}
        title="¿Retirar esta necesidad?"
        description="Se retirará tu solicitud de reposición y cambiará el volumen del grupo. Las participaciones anteriores deberán revisarse."
      >
        {mutate.error && (
          <p className="error mt-4" role="alert">
            {mutate.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            variant="outline"
            disabled={mutate.isPending}
            onClick={() => setWithdrawing(undefined)}
          >
            Cancelar
          </Button>
          <Button
            disabled={mutate.isPending}
            onClick={async () => {
              if (!withdrawing) return;
              try {
                await mutate.mutateAsync(() =>
                  repository.withdraw(withdrawing.id, stall),
                );
                setWithdrawing(undefined);
                setSuccess("Tu necesidad fue retirada correctamente.");
              } catch {
                /* Keep confirmation open. */
              }
            }}
          >
            {mutate.isPending ? "Retirando…" : "Sí, retirar necesidad"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
