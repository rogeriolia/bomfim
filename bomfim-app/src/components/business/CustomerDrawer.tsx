import { Link } from "react-router";
import { useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button, Choice, Status } from "@/components/bomfim/ui";
import { type Registration, integrations, stages } from "@/data/mocks/registrations";

export function CustomerDrawer({ record, onClose }: { record: Registration | null; onClose: () => void }) {
    const { update, notify } = useApp();
    return (
        <SlideoutMenu
            isOpen={!!record}
            onOpenChange={(v) => {
                if (!v) onClose();
            }}
            isDismissable
        >
            {record && (
                <>
                    <SlideoutMenu.Header onClose={onClose}>
                        <div className="eyebrow">CAD-{record.id.padStart(4, "0")}</div>
                        <h2>Cadastro</h2>
                        <p className="subtle">Detalhes e acompanhamento</p>
                    </SlideoutMenu.Header>
                    <SlideoutMenu.Content>
                        <Status>Sincronizado com Moskit</Status>
                        <h2>{record.name}</h2>
                        <section className="drawer-section">
                            <h3>Dados cadastrais</h3>
                            <dl>
                                {[
                                    ["Razão social", record.name],
                                    ["CNPJ", record.cnpj],
                                    ["Localidade", record.city],
                                    ["CEP", "40.010-000"],
                                    ["Tabela de preços", record.table],
                                    ["Promotor", record.promoter],
                                    ["Responsável", record.owner],
                                    ["Usuário SSW", record.usuario_ssw || "—"],
                                ].map(([a, b]) => (
                                    <div key={a}>
                                        <dt>{a}</dt>
                                        <dd>{b}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                        <Choice
                            label="Etapa do cadastro"
                            value={String(record.stage)}
                            onChange={(v) => {
                                update(record.id, { stage: Number(v) });
                                notify("Etapa atualizada nesta demonstração.");
                            }}
                            items={stages.map((s, i) => ({ id: String(i), label: s }))}
                        />
                        <section className="drawer-section">
                            <h3>Status e integrações</h3>
                            {integrations.map((i) => (
                                <div className="integration-row" key={i}>
                                    <span>{i}</span>
                                    <Status>{i === "Assinatura Digital" && record.stage < 3 ? "Aguardando" : "OK"}</Status>
                                </div>
                            ))}
                        </section>
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
