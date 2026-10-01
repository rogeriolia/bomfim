import { useState } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Link } from "react-router";
import { useApp } from "@/app/store";
import { Button, Choice, DataTable, ExportButton, Metric, PageHeading, PageState, Status, exportCsv } from "@/components/bomfim/ui";
import { CompanyIdentity } from "@/components/business/RegistrationCard";
import { integrations, stages } from "@/data/mocks/registrations";

export default function OverviewPage() {
    const { records } = useApp();
    const [period, setPeriod] = useState("all");
    const [unit, setUnit] = useState("all");
    const [filters, setFilters] = useState(false);
    const shown = records.filter((r) => (period === "all" || r.updated >= "2026-09-28") && (unit === "all" || r.unit === unit));
    return (
        <div className="page">
            <PageHeading title="Visão Geral" eyebrow="BOM DIA, RENATA" description="Acompanhe os principais indicadores e atividades da operação.">
                <Button color="secondary" size="sm" onClick={() => setPeriod(period === "all" ? "recent" : "all")}>
                    {period === "all" ? "Setembro, 2026" : "Últimos 3 dias"}
                </Button>
                <Button color="secondary" size="sm" onClick={() => setFilters(!filters)}>
                    Filtros
                </Button>
                <ExportButton
                    onClick={() =>
                        exportCsv(
                            "visao-geral",
                            ["Empresa", "Etapa"],
                            shown.map((r) => [r.name, stages[r.stage]]),
                        )
                    }
                />
            </PageHeading>
            {filters && (
                <div className="filter-panel">
                    <Choice
                        label="Unidade"
                        value={unit}
                        onChange={setUnit}
                        items={[{ id: "all", label: "Todas as unidades" }, ...["Salvador", "Feira de Santana", "Aracaju"].map((x) => ({ id: x, label: x }))]}
                    />
                </div>
            )}
            <PageState>
                <div className="metrics">
                    {["Cadastros ativos", "Em andamento", "Aguardando assinatura", "Finalizados", "Declinados"].map((s, i) => (
                        <Metric key={s} label={s} value={i === 0 ? shown.filter((r) => r.stage < 3).length : shown.filter((r) => r.stage === i).length} />
                    ))}
                </div>
                <div className="overview-grid">
                    <section className="panel funnel-panel">
                        <div className="section-heading">
                            <div>
                                <h2>Uma visão do seu funil</h2>
                                <p>Cadastros por etapa da operação</p>
                            </div>
                            <Button color="link-gray" size="sm" href="/cadastro/kanban" iconTrailing={ArrowRight}>
                                Abrir funil
                            </Button>
                        </div>
                        <div className="funnel-bars">
                            {stages.slice(0, 4).map((s, i) => {
                                const n = shown.filter((r) => r.stage === i).length;
                                return (
                                    <div key={s}>
                                        <div className="funnel-bar" style={{ height: 50 + n * 13 }}>
                                            <b>{n}</b>
                                        </div>
                                        <strong>{s.replace("Cadastro ", "")}</strong>
                                        <span>{shown.length ? Math.round((n / shown.length) * 100) : 0}% dos cadastros</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="funnel-note">
                            <span className="tiny-dot" />
                            Conversão em clientes{" "}
                            <strong>{shown.length ? Math.round((shown.filter((r) => r.stage === 3).length / shown.length) * 100) : 0}%</strong>
                            <span>Dados do período selecionado</span>
                        </div>
                    </section>
                    <section className="panel">
                        <div className="section-heading">
                            <div>
                                <h2>Integrações</h2>
                                <p>Sua operação conectada</p>
                            </div>
                            <span className="live-dot" />
                        </div>
                        {integrations.map((s, i) => (
                            <Link to={["/moskit", "/documentos", "/assinaturas", "/documentos"][i]} className="integration-card" key={s}>
                                <span className="integration-icon">{s.slice(0, 1)}</span>
                                <div>
                                    <strong>{s}</strong>
                                    <small>Verificado hoje, às 09:42</small>
                                </div>
                                <Status>{i === 0 ? "Sincronizado" : "Ativa"}</Status>
                            </Link>
                        ))}
                        <div className="integration-foot">Simulação local · Nenhum serviço externo conectado</div>
                    </section>
                </div>
                <section className="activity-section">
                    <div className="section-heading">
                        <div>
                            <h2>Atividades recentes</h2>
                            <p>As últimas movimentações da equipe</p>
                        </div>
                        <Button color="link-gray" size="sm" href="/clientes" iconTrailing={ArrowRight}>
                            Ver clientes
                        </Button>
                    </div>
                    <DataTable
                        title="Atividades recentes"
                        columns={["Empresa", "Etapa", "Responsável", "Última atividade", "Status"]}
                        rows={shown.slice(0, 5).map((r) => [
                            <Link to={"/clientes/" + r.id}>
                                <CompanyIdentity name={r.name} />
                            </Link>,
                            stages[r.stage],
                            r.owner,
                            r.updated.split("-").reverse().join("/"),
                            <Status>{r.stage === 3 ? "Concluído" : "Em andamento"}</Status>,
                        ])}
                    />
                </section>
            </PageState>
        </div>
    );
}
