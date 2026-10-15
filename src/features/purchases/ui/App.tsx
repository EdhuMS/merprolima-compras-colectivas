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
import { createSnapshotExport, type ExportPeriod } from "../domain/export";
import { downloadJson } from "../../../lib/download";
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
  const [view, setView] = useState<View>("overview");
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);
  const [demoStall, setStall] = useState(stalls[0]);
  const [demoRole, setRole] = useState("buyer");
  const navigation = useWorkspaceSidebar();
  const [formOpen, setFormOpen] = useState(false);
  const [needRequestId, setNeedRequestId] = useState<string>();
  const [editing, setEditing] = useState<Need>();
  const [detail, setDetail] = useState<string>();
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
  useEffect(() => {
    setView("overview");
  }, [role]);
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
  const demand = groups.filter((g) => g.total > 0);
  const selected =
    groups.find((g) => g.key === detail) ??
    (draft?.key === detail ? draft : undefined);
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
            productId: products[0]?.id ?? "",
            qty: 1,
            date: groups[0]?.date ?? "",
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
  const exportData = async (period: ExportPeriod, analytical = false) => {
    if (!query.data) return;
    const data =
      analytical && repository.exportAnalytical
        ? await repository.exportAnalytical(period)
        : createSnapshotExport({ ...query.data, products }, period, isDemo);
    downloadJson(
      data,
      `sumabasto-${analytical ? "resumen-mercado" : "mis-registros"}.json`,
    );
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
            title: "Panel de coordinación",
            icon: LayoutDashboard,
          },
          { id: "needs", title: "Necesidades recibidas", icon: ClipboardList },
          { id: "groups", title: "Gestionar compras", icon: ShoppingBasket },
          { id: "catalog", title: "Catálogo de productos", icon: Package },
          { id: "evidence", title: "Reportes del mercado", icon: ShieldCheck },
        ]
      : [
          { id: "overview", title: "Resumen", icon: LayoutDashboard },
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
          "Resumen de abastecimiento.",
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
      onOpen={setDetail}
      isDemo={isDemo}
      management={isCoordinator}
    />
  );
  return (
    <div
      className={cn(
        "app-shell",
        !navigation.isMobile &&
          !navigation.desktopVisible &&
          "sidebar-collapsed",
      )}
    >
      <WorkspaceSidebar navigation={navigation}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setView("overview");
            if (navigation.isMobile) navigation.close();
          }}
        >
          <BrandLogo compact />
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
                if (navigation.isMobile) navigation.close();
              }}
              aria-current={view === n.id ? "page" : undefined}
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
            <ShieldCheck size={20} className="text-[#c2d785]" />
            <div>
              <strong className="text-sm">Tu espacio de compras</strong>
              <p className="mt-2 text-xs leading-5 text-[#becbc3]">
                Necesidades y propuestas en un solo lugar.
              </p>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-[#91a79a]">
            MERPROLIMA · LOS OLIVOS
          </p>
        </div>
      </WorkspaceSidebar>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              ref={navigation.toggleRef}
              className="sidebar-toggle"
              aria-label={
                navigation.expanded
                  ? "Ocultar panel lateral"
                  : "Mostrar panel lateral"
              }
              aria-expanded={navigation.expanded}
              aria-controls="workspace-navigation"
              onClick={navigation.toggle}
            >
              <Menu />
            </button>
            <span className="desktop-breadcrumb text-sm muted">Tu mercado</span>
            <ChevronRight size={14} className="muted" />
            <strong className="text-sm">Merprolima</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-neutral hidden sm:inline-flex">
              {role === "coordinator" ? "Coordinación" : "Mi puesto"}
            </span>
            {accountAction}
            <div className="avatar">{role === "buyer" ? "P" : "C"}</div>
          </div>
        </header>
        <main className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">ABASTECIMIENTO COMPARTIDO</p>
              <h1>{headings[view][0]}</h1>
              <p className="mt-3 muted">{headings[view][1]}</p>
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
              ["overview", "groups", "needs"].includes(view) && (
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
          <div className="context-bar">
            <label className="flex items-center gap-3 text-sm">
              <span className="muted">Puesto</span>
              <select
                disabled={!isDemo}
                aria-label="Puesto"
                value={stall}
                onChange={(e) => setStall(e.target.value)}
              >
                {(isDemo ? stalls : [stall]).map((s) => (
                  <option key={s} value={s}>
                    {s === "COORD-G8"
                      ? "Coordinación"
                      : s.replace("TESTER-", "Puesto ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <span className="muted">Vista</span>
              <select
                disabled={!isDemo}
                aria-label="Vista"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="buyer">Comprador</option>
                <option value="coordinator">Coordinador</option>
              </select>
            </label>
          </div>
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
                <>
                  {isCoordinator ? (
                    <CoordinationPanel
                      groups={groups}
                      onOpen={setDetail}
                      onManage={() => setView("groups")}
                    />
                  ) : (
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
                            <small>50 kg</small>
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
                          <strong>
                            {mine.length.toString().padStart(2, "0")}
                          </strong>
                          <small>Reposiciones por coordinar</small>
                        </div>
                        <div>
                          <span className="stat-icon">
                            <ShoppingBasket size={19} />
                          </span>
                          <p>Propuestas con volumen</p>
                          <strong>
                            {validGroups.toString().padStart(2, "0")}
                          </strong>
                          <small>Revisa el costo total</small>
                        </div>
                        <div>
                          <span className="stat-icon">
                            <Check size={19} />
                          </span>
                          <button
                            className="text-left"
                            onClick={() => setView("participations")}
                          >
                            Mis participaciones →
                          </button>
                          <strong>{active.toString().padStart(2, "0")}</strong>
                          <small>Confirmaciones vigentes</small>
                        </div>
                      </section>
                    </>
                  )}
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
                    {published.slice(0, 3).map(card)}
                  </section>
                  {!published.length && (
                    <div className="empty workspace-empty">
                      <ShoppingBasket size={32} />
                      <h2>
                        {isCoordinator
                          ? "Prepara la primera propuesta"
                          : "Aún no hay compras publicadas"}
                      </h2>
                      <p>
                        {isCoordinator
                          ? "Consulta las necesidades recibidas y publica una compra colectiva."
                          : "Puedes registrar tu necesidad para que coordinación prepare una propuesta."}
                      </p>
                      <Button
                        disabled={!products.length}
                        onClick={() => setView("needs")}
                      >
                        <Plus size={17} />
                        {isCoordinator
                          ? "Ver necesidades recibidas"
                          : "Ir a mis necesidades"}
                      </Button>
                    </div>
                  )}
                  <div className="how-panel">
                    <ShieldCheck size={24} />
                    <div>
                      <h3 className="font-semibold">
                        Condiciones antes de participar.
                      </h3>
                      <p className="muted text-sm mt-1">
                        Revisa el costo total, la entrega y la vigencia de cada
                        propuesta.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {view === "groups" && (
                <>
                  <div className="section-heading">
                    <h2>{published.length} compras publicadas</h2>
                    <span className="text-xs muted">
                      Entrega o recojo compatibles
                    </span>
                  </div>
                  <section className="cards-grid">
                    {published.map(card)}
                  </section>
                  {!published.length && (
                    <div className="empty">
                      <ShoppingBasket />
                      <h2>No hay compras publicadas</h2>
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
                  stall={stall}
                  onOpen={setDetail}
                  onBrowse={() => setView("groups")}
                />
              )}
              {view === "needs" && isCoordinator && (
                <section className="white-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Demanda de los clientes</h2>
                      <p className="text-sm muted mt-1">
                        Agrupada por producto, fecha y modalidad. Solo los
                        clientes registran cantidades.
                      </p>
                    </div>
                  </div>
                  <div className="cards-grid">{demand.map(card)}</div>
                  {!demand.length && (
                    <div className="empty">
                      <ClipboardList />
                      <h3>Aún no hay necesidades recibidas</h3>
                      <p>
                        Puedes preparar una propuesta desde Crear compra
                        colectiva.
                      </p>
                    </div>
                  )}
                </section>
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
                  canExportAnalytical={!isDemo && role === "coordinator"}
                  origin={query.data?.identity?.origin ?? "simulated"}
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
