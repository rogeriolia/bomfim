import { useState } from "react";
import { Link, useParams } from "react-router";
import { canEditOperationalData } from "@/app/permissions";
import { useApp } from "@/app/store";
import { Button, ContextNavigation, DataTable, Input, PageHeading, PageState, Status } from "@/components/bomfim/ui";
import { integrations, stages } from "@/data/mocks/registrations";

export default function ClienteDetailPage() {
    const { id, section = "visao-geral" } = useParams();
    const { user, records, update, notify } = useApp();
    const canEdit = user ? canEditOperationalData(user.role) : false;
    const r = records.find((x) => x.id === id);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(r?.name || "");
    const [cnpj, setCnpj] = useState(r?.cnpj || "");
    if (!r)
        return (
            <div className="page empty">
                <h1>Cliente não encontrado</h1>
                <Link to="/clientes">Voltar aos clientes</Link>
            </div>
        );
    return (
        <div className="page">
            <Link to="/clientes" className="text-link">
                ← Clientes
            </Link>
            <PageHeading title={r.name} description={`${r.cnpj} · ${r.city}`}>
                <Status>{stages[r.stage]}</Status>
                {canEdit && (
                    <Button color="secondary" size="sm" onClick={() => setEditing(!editing)}>
                        {editing ? "Cancelar" : "Editar cadastro"}
                    </Button>
                )}
            </PageHeading>
            <ContextNavigation
                items={["Visão geral", "Dados cadastrais", "Documentos", "Assinaturas", "Integrações", "Atividades"].map((s, i) => [
                    s,
                    `/clientes/${id}/${["visao-geral", "dados", "documentos", "assinaturas", "integracoes", "atividades"][i]}`,
                ])}
            />
            <PageState>
                {editing ? (
                    <form
                        className="panel form-stack"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await update(r.id, { name, cnpj });
                                notify("Dados atualizados.");
                                setEditing(false);
                            } catch {
                                notify("Não foi possível salvar. Verifique a API.");
                            }
                        }}
                    >
                        <Input label="Razão social" isRequired value={name} onChange={setName} />
                        <Input label="CNPJ" isRequired value={cnpj} onChange={setCnpj} />
                        <Button type="submit">Salvar alterações</Button>
                    </form>
                ) : section === "documentos" ? (
                    <DataTable
                        title="Documentos do cliente"
                        columns={["Documento", "Tipo", "Status"]}
                        rows={[
                            [`Contrato social — ${r.name}`, "PDF", <Status>Aprovado</Status>],
                            ["Comprovante de endereço", "PDF", <Status>Aguardando</Status>],
                        ]}
                    />
                ) : section === "assinaturas" ? (
                    <DataTable
                        title="Assinaturas do cliente"
                        columns={["Documento", "Signatário", "Status"]}
                        rows={[[`Contrato de transporte`, r.owner, <Status>{r.stage === 3 ? "Concluído" : "Aguardando"}</Status>]]}
                    />
                ) : section === "integracoes" ? (
                    <section className="panel">
                        {integrations.map((s) => (
                            <div className="integration-row" key={s}>
                                <strong>{s}</strong>
                                <Status>Sincronizado</Status>
                            </div>
                        ))}
                    </section>
                ) : section === "atividades" ? (
                    <section className="panel">
                        <h2>Histórico do cadastro</h2>
                        {["Cadastro recebido", "Dados validados", "Sincronização com Moskit concluída"].map((s, i) => (
                            <div className="timeline-item" key={s}>
                                <span>{i + 1}</span>
                                <div>
                                    <strong>{s}</strong>
                                    <p>
                                        {r.updated} · {r.owner}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </section>
                ) : (
                    <div className="detail-grid">
                        <section className="panel">
                            <h2>Dados cadastrais</h2>
                            <dl className="detail-list">
                                {[
                                    ["Razão social", r.name],
                                    ["CNPJ", r.cnpj],
                                    ["Unidade", r.unit],
                                    ["Tabela de preços", r.table],
                                    ["Promotor", r.promoter],
                                    ["Responsável", r.owner],
                                ].map(([a, b]) => (
                                    <div key={a}>
                                        <dt>{a}</dt>
                                        <dd>{b}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                        <section className="panel">
                            <h2>Acompanhamento</h2>
                            <p className="subtle">Última atualização em {r.updated.split("-").reverse().join("/")}</p>
                            <div className="timeline-item">
                                <span>✓</span>
                                <div>
                                    <strong>Dados recebidos</strong>
                                    <p>Cadastro disponível para a operação.</p>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <span>↻</span>
                                <div>
                                    <strong>{stages[r.stage]}</strong>
                                    <p>Responsável: {r.owner}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </PageState>
        </div>
    );
}
