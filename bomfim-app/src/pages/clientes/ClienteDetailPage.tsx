import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError, api, type ApiUser } from "@/api/client";
import { canEditOperationalData } from "@/app/permissions";
import { useApp } from "@/app/store";
import { CnpjField } from "@/components/bomfim/cnpj-field";
import { Button, Choice, ContextNavigation, DataTable, Input, PageHeading, PageState, Status } from "@/components/bomfim/ui";
import { cnpjForSubmit, validateCnpj } from "@/utils/cnpj";
import { integrations, stages } from "@/data/mocks/registrations";

const PRICE_TABLES = ["Capital Express", "Interior Premium", "Regional Standard"];

function uniqueChoiceItems(values: string[], current: string) {
    const set = new Set([...values, current].filter(Boolean));
    return Array.from(set).map((s) => ({ id: s, label: s }));
}

function userChoiceItems(users: ApiUser[], current: string) {
    const names = new Set(users.map((u) => u.name));
    if (current) names.add(current);
    return Array.from(names)
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((name) => ({ id: name, label: name }));
}

function registrationTable(reg: { table?: string; tipo_cobranca?: string }) {
    return reg.table || reg.tipo_cobranca || "";
}

export default function ClienteDetailPage() {
    const { id, section = "visao-geral" } = useParams();
    const { user, records, update, notify } = useApp();
    const canEdit = user ? canEditOperationalData(user.role) : false;
    const r = records.find((x) => x.id === id);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(r?.name || "");
    const [cnpj, setCnpj] = useState(r?.cnpj || "");
    const [unit, setUnit] = useState(r?.unit || "");
    const [table, setTable] = useState(r ? registrationTable(r) : "");
    const [promoter, setPromoter] = useState(r?.promoter || "");
    const [owner, setOwner] = useState(r?.owner || "");
    const [usuarioSsw, setUsuarioSsw] = useState(r?.usuario_ssw || "");
    const [formError, setFormError] = useState("");
    const [unitNames, setUnitNames] = useState<string[]>([]);
    const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);

    useEffect(() => {
        if (!editing || !canEdit) return;
        let cancelled = false;
        void (async () => {
            try {
                const [units, users] = await Promise.all([api.listUnits(), api.listUsers()]);
                if (cancelled) return;
                setUnitNames(units.map((u) => u.name));
                setApiUsers(users);
            } catch {
                if (!cancelled) {
                    setUnitNames([]);
                    setApiUsers([]);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [editing, canEdit]);

    const unitItems = useMemo(() => uniqueChoiceItems(unitNames, unit), [unitNames, unit]);
    const tableItems = useMemo(() => uniqueChoiceItems([...PRICE_TABLES], table), [table]);
    const promoterItems = useMemo(
        () => userChoiceItems(apiUsers.filter((u) => u.role === "promoter" && u.status !== "inactive"), promoter),
        [apiUsers, promoter],
    );
    const ownerItems = useMemo(
        () =>
            userChoiceItems(
                apiUsers.filter((u) => u.status !== "inactive" && u.role !== "promoter"),
                owner,
            ),
        [apiUsers, owner],
    );

    const resetFormFromRecord = () => {
        if (!r) return;
        setName(r.name);
        setCnpj(r.cnpj);
        setUnit(r.unit);
        setTable(registrationTable(r));
        setPromoter(r.promoter);
        setOwner(r.owner);
        setUsuarioSsw(r.usuario_ssw || "");
    };

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
                    <Button
                        color="secondary"
                        size="sm"
                        onClick={() => {
                            if (!editing) {
                                resetFormFromRecord();
                            }
                            setEditing(!editing);
                        }}
                    >
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
                            setFormError("");
                            const cnpjToSave = cnpjForSubmit(cnpj);
                            const cnpjErr = validateCnpj(cnpjToSave);
                            if (cnpjErr) {
                                setFormError(cnpjErr);
                                return;
                            }
                            try {
                                await update(r.id, {
                                    name,
                                    cnpj: cnpjToSave,
                                    unit,
                                    table,
                                    promoter,
                                    owner,
                                    usuario_ssw: usuarioSsw.trim(),
                                });
                                notify("Dados atualizados.");
                                setEditing(false);
                            } catch (err) {
                                setFormError(err instanceof ApiError ? err.message : "Não foi possível salvar.");
                            }
                        }}
                    >
                        <Input label="Razão social" isRequired value={name} onChange={setName} />
                        <CnpjField
                            isRequired
                            value={cnpj}
                            onChange={setCnpj}
                            onLookup={(data) => {
                                if (data.name) setName(data.name);
                            }}
                        />
                        <Choice label="Unidade" value={unit} onChange={setUnit} items={unitItems} />
                        <Choice label="Tabela de preços" value={table} onChange={setTable} items={tableItems} />
                        <Choice label="Promotor" value={promoter} onChange={setPromoter} items={promoterItems} />
                        <Choice label="Responsável" value={owner} onChange={setOwner} items={ownerItems} />
                        <Input label="Usuário SSW" value={usuarioSsw} onChange={setUsuarioSsw} placeholder="Opcional" />
                        {formError && (
                            <p role="alert" className="error-text">
                                {formError}
                            </p>
                        )}
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
                                    ["Usuário SSW", r.usuario_ssw || "—"],
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
