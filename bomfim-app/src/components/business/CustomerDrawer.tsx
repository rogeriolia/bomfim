import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError, api, type CnpjLookupResult } from "@/api/client";
import { useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button, Choice, Status } from "@/components/bomfim/ui";
import {
    bomfimSection,
    receitaActivities,
    receitaAddress,
    receitaIdentification,
    receitaQsa,
    receitaSituation,
    type FieldRow,
} from "@/components/business/drawer-field-format";
import { RegistrationAnexosList } from "@/components/business/registration-anexos-list";
import { type Registration, integrations, stageLabel, stages } from "@/data/mocks/registrations";

const CLICK_SIGN = "Click Sign";

function DrawerSection({ title, rows }: { title: string; rows: FieldRow[] }) {
    if (!rows.length) return null;
    return (
        <section className="drawer-section">
            <h3>{title}</h3>
            <dl className="drawer-field-list">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

export function CustomerDrawer({ record, onClose }: { record: Registration | null; onClose: () => void }) {
    const { update, notify } = useApp();
    const [fullRecord, setFullRecord] = useState<Registration | null>(null);
    const [receita, setReceita] = useState<CnpjLookupResult | null>(null);
    const [receitaLoading, setReceitaLoading] = useState(false);
    const [receitaError, setReceitaError] = useState<string | null>(null);

    useEffect(() => {
        if (!record) {
            setFullRecord(null);
            return;
        }
        let cancelled = false;
        void api.getRegistration(record.id).then(
            (row) => {
                if (!cancelled) setFullRecord(row);
            },
            () => {
                if (!cancelled) setFullRecord(record);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [record?.id]);

    const view = fullRecord ?? record;

    useEffect(() => {
        if (!view) {
            setReceita(null);
            setReceitaError(null);
            setReceitaLoading(false);
            return;
        }
        let cancelled = false;
        setReceitaLoading(true);
        setReceitaError(null);
        void (async () => {
            try {
                const data = await api.lookupCnpj(view.cnpj);
                if (!cancelled) setReceita(data);
            } catch (e) {
                if (!cancelled) {
                    setReceita(null);
                    setReceitaError(e instanceof ApiError ? e.message : "Não foi possível consultar a Receita Federal.");
                }
            } finally {
                if (!cancelled) setReceitaLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [view?.id, view?.cnpj]);

    return (
        <SlideoutMenu
            isOpen={!!record}
            onOpenChange={(v) => {
                if (!v) onClose();
            }}
            isDismissable
            className="w-[80vw] max-w-[80vw]"
        >
            {record && view && (
                <>
                    <SlideoutMenu.Header onClose={onClose}>
                        <div className="eyebrow">CAD-{view.id.padStart(4, "0")}</div>
                        <h2>Cadastro</h2>
                        <p className="subtle">Detalhes e acompanhamento</p>
                    </SlideoutMenu.Header>
                    <SlideoutMenu.Content className="drawer-wide-content">
                        <Status>Sincronizado com Moskit</Status>
                        <h2 className="drawer-company-title">{view.name}</h2>
                        {receitaLoading && <p className="subtle drawer-receita-hint">Consultando Receita Federal…</p>}
                        {receitaError && !receitaLoading && <p className="subtle drawer-receita-hint">{receitaError}</p>}
                        <div className="drawer-wide-grid">
                            <DrawerSection
                                title="Cadastro Bomfim"
                                rows={bomfimSection(view, stageLabel(view.stage))}
                            />
                            {(view.anexos?.length ?? 0) > 0 && (
                                <section className="drawer-section drawer-section-full">
                                    <RegistrationAnexosList
                                        registrationId={view.id}
                                        anexos={view.anexos ?? []}
                                        title="Anexos"
                                        compact
                                    />
                                    <Link to={`/clientes/${view.id}/documentos`} onClick={onClose} className="text-link">
                                        Ver todos os documentos →
                                    </Link>
                                </section>
                            )}
                            {!receitaLoading && (
                                <>
                                    <DrawerSection
                                        title="Identificação (Receita)"
                                        rows={
                                            receita
                                                ? receitaIdentification(receita)
                                                : [["Receita Federal", receitaError || "Consulta indisponível"]]
                                        }
                                    />
                                    <DrawerSection title="Endereço e contato" rows={receitaAddress(receita, view.contact_email, view.postal_code)} />
                                    {receita && (
                                        <>
                                            <DrawerSection title="Situação cadastral" rows={receitaSituation(receita)} />
                                            <DrawerSection title="Atividade econômica" rows={receitaActivities(receita)} />
                                            <DrawerSection title="Quadro societário" rows={receitaQsa(receita)} />
                                        </>
                                    )}
                                </>
                            )}
                            <section className="drawer-section drawer-section-full">
                                <Choice
                                    label="Etapa do cadastro"
                                    value={String(view.stage ?? 0)}
                                    onChange={(v) => {
                                        update(view.id, { stage: Number(v) });
                                        notify("Etapa atualizada nesta demonstração.");
                                    }}
                                    items={stages.map((s, i) => ({ id: String(i), label: s }))}
                                />
                            </section>
                            <section className="drawer-section drawer-section-full">
                                <h3>Status e integrações</h3>
                                {integrations.map((i) => (
                                    <div className="integration-row" key={i}>
                                        <span>{i}</span>
                                        <Status>{i === CLICK_SIGN && (view.stage ?? 0) < 3 ? "Aguardando" : "OK"}</Status>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </SlideoutMenu.Content>
                    <SlideoutMenu.Footer>
                        <div className="actions">
                            <Link to={"/clientes/" + view.id} onClick={onClose} className="text-link">
                                Ver formulário completo →
                            </Link>
                            <Dropdown.Root>
                                <Button color="secondary" size="sm">
                                    Mais ações
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu>
                                        <Dropdown.Item
                                            onAction={() => {
                                                update(view.id, { stage: 3 });
                                                notify("Cadastro finalizado.");
                                                onClose();
                                            }}
                                        >
                                            Finalizar cadastro
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onAction={() => {
                                                update(view.id, { stage: 4 });
                                                notify("Cadastro declinado.");
                                                onClose();
                                            }}
                                        >
                                            Declinar cadastro
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown.Root>
                        </div>
                    </SlideoutMenu.Footer>
                </>
            )}
        </SlideoutMenu>
    );
}
