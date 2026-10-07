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
import { type Registration, integrations, stages } from "@/data/mocks/registrations";

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
    const [receita, setReceita] = useState<CnpjLookupResult | null>(null);
    const [receitaLoading, setReceitaLoading] = useState(false);
    const [receitaError, setReceitaError] = useState<string | null>(null);

    useEffect(() => {
        if (!record) {
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
                const data = await api.lookupCnpj(record.cnpj);
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
    }, [record?.id, record?.cnpj]);

    return (
        <SlideoutMenu
            isOpen={!!record}
            onOpenChange={(v) => {
                if (!v) onClose();
            }}
            isDismissable
            className="w-[80vw] max-w-[80vw]"
        >
            {record && (
                <>
                    <SlideoutMenu.Header onClose={onClose}>
                        <div className="eyebrow">CAD-{record.id.padStart(4, "0")}</div>
                        <h2>Cadastro</h2>
                        <p className="subtle">Detalhes e acompanhamento</p>
                    </SlideoutMenu.Header>
                    <SlideoutMenu.Content className="drawer-wide-content">
                        <Status>Sincronizado com Moskit</Status>
                        <h2 className="drawer-company-title">{record.name}</h2>
                        {receitaLoading && <p className="subtle drawer-receita-hint">Consultando Receita Federal…</p>}
                        {receitaError && !receitaLoading && <p className="subtle drawer-receita-hint">{receitaError}</p>}
                        <div className="drawer-wide-grid">
                            <DrawerSection title="Cadastro Bomfim" rows={bomfimSection(record, stages[record.stage] ?? "—")} />
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
                                    <DrawerSection title="Endereço e contato" rows={receitaAddress(receita, record.contact_email, record.postal_code)} />
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
                                    value={String(record.stage)}
                                    onChange={(v) => {
                                        update(record.id, { stage: Number(v) });
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
                                        <Status>{i === CLICK_SIGN && record.stage < 3 ? "Aguardando" : "OK"}</Status>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </SlideoutMenu.Content>
                    <SlideoutMenu.Footer>
                        <div className="actions">
                            <Link to={"/clientes/" + record.id} onClick={onClose} className="text-link">
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
                                                update(record.id, { stage: 3 });
                                                notify("Cadastro finalizado.");
                                                onClose();
                                            }}
                                        >
                                            Finalizar cadastro
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onAction={() => {
                                                update(record.id, { stage: 4 });
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
