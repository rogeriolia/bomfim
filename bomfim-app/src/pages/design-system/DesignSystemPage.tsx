import { useState } from "react";
import { useApp } from "@/app/store";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { TextArea } from "@/components/base/textarea/textarea";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { BomfimLogo } from "@/components/bomfim/BomfimLogo";
import { Badge, Button, Choice, ContextNavigation, DataTable, Input, Metric, PageHeading, PageState } from "@/components/bomfim/ui";
import { CustomerDrawer } from "@/components/business/CustomerDrawer";
import { KanbanColumn } from "@/components/business/KanbanColumn";
import { RegistrationCard } from "@/components/business/RegistrationCard";

export default function DesignSystemPage() {
    const { records, notify } = useApp();
    const [select, setSelect] = useState("a");
    const [drawer, setDrawer] = useState(false);
    const [modal, setModal] = useState(false);
    return (
        <div className="page design-system">
            <PageHeading
                title="Bomfim Design System"
                eyebrow="PRODUCT UI / PACK 01"
                description="Identidade Bomfim. Componentes reais Untitled UI. Uma base consistente."
            />
            <PageState>
                <section className="panel">
                    <h2>Brand</h2>
                    <div className="brand-showcase">
                        <BomfimLogo />
                        <BomfimLogo variant="symbol" />
                        <div className="navy-swatch">
                            <BomfimLogo variant="white" />
                        </div>
                    </div>
                    <div className="swatches">
                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => (
                            <div key={n}>
                                <span style={{ background: `var(--color-brand-${n})` }} />
                                <small>Brand {n}</small>
                            </div>
                        ))}
                    </div>
                </section>
                <div className="two-grid">
                    <section className="panel">
                        <h2>Typography</h2>
                        <div className="type-samples">
                            <div className="text-display-xs">Display · Inter</div>
                            <h1>H1 · Visão Geral</h1>
                            <h2>H2 · Operação conectada</h2>
                            <h3>H3 · Dados cadastrais</h3>
                            <p>Body · Clareza para cada etapa.</p>
                            <label>Label · Nome da empresa</label>
                            <small>Caption · Atualizado agora</small>
                        </div>
                    </section>
                    <section className="panel">
                        <h2>Buttons</h2>
                        <div className="sample-grid">
                            <Button onClick={() => notify("Ação principal executada.")}>Primary</Button>
                            <Button color="secondary">Secondary</Button>
                            <Button color="tertiary">Tertiary</Button>
                            <Button color="primary-destructive" onClick={() => setModal(true)}>
                                Destructive
                            </Button>
                            <Button isDisabled>Disabled</Button>
                            <Button isLoading>Loading</Button>
                        </div>
                    </section>
                    <section className="panel form-stack">
                        <h2>Inputs</h2>
                        <Input label="Text" placeholder="Nome da empresa" />
                        <Input label="Search" type="search" placeholder="Buscar..." />
                        <Choice
                            label="Select"
                            value={select}
                            onChange={setSelect}
                            items={[
                                { id: "a", label: "Salvador" },
                                { id: "b", label: "Aracaju" },
                            ]}
                        />
                        <TextArea label="Textarea" placeholder="Observações" />
                        <Checkbox label="Checkbox" />
                        <RadioGroup aria-label="Tipo de cadastro" defaultValue="a">
                            <RadioButton value="a" label="Pessoa jurídica" />
                            <RadioButton value="b" label="Pessoa física" />
                        </RadioGroup>
                        <Toggle label="Switch" />
                    </section>
                    <section className="panel form-stack">
                        <h2>Feedback</h2>
                        <div className="actions">
                            <Badge color="brand">Brand</Badge>
                            <Badge color="success">Success</Badge>
                            <Badge color="warning">Warning</Badge>
                            <Badge color="error">Error</Badge>
                        </div>
                        <div className="info-alert" role="status">
                            Cadastro salvo com sucesso.
                        </div>
                        <Button color="secondary" onClick={() => notify("Este é o toast da Bomfim.")}>
                            Exibir toast
                        </Button>
                        <ProgressBarBase value={65} />
                        <span className="subtle">65% concluído</span>
                        <div className="skeleton" />
                        <div className="column-empty">Nenhum registro encontrado</div>
                        <h2>Overlay</h2>
                        <div className="actions">
                            <Button color="secondary" onClick={() => setModal(true)}>
                                Modal
                            </Button>
                            <Button color="secondary" onClick={() => setDrawer(true)}>
                                Drawer
                            </Button>
                            <Tooltip title="Informação de apoio">
                                <TooltipTrigger>Tooltip</TooltipTrigger>
                            </Tooltip>
                        </div>
                        <Dropdown.Root>
                            <Button color="secondary">Dropdown</Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu>
                                    <Dropdown.Item onAction={() => notify("Opção selecionada.")}>Selecionar opção</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                    </section>
                </div>
                <section className="panel">
                    <h2>Navigation</h2>
                    <nav aria-label="Breadcrumb" className="breadcrumb">
                        <a href="/overview">Início</a>
                        <span>/</span>
                        <span>Design System</span>
                    </nav>
                    <ContextNavigation
                        items={[
                            ["Visão Geral", "/overview"],
                            ["Design System", "/design-system"],
                        ]}
                    />
                    <p className="subtle">As abas utilizam rotas e preservam histórico e links diretos.</p>
                </section>
                <div className="two-grid">
                    <section className="panel">
                        <h2>Data</h2>
                        <Metric label="Cadastros ativos" value={18} />
                        <DataTable title="Exemplo de tabela" columns={["Empresa", "Status"]} rows={[[records[0].name, <Badge color="success">Ativo</Badge>]]} />
                        <div className="pagination">
                            <span>Página 1 de 1</span>
                            <Button color="secondary" size="sm" isDisabled>
                                Próxima
                            </Button>
                        </div>
                    </section>
                    <section className="panel">
                        <h2>Bomfim components</h2>
                        <KanbanColumn title="Caixa de entrada" count={1} variant={0}>
                            <RegistrationCard record={records[0]} onSelect={() => setDrawer(true)} />
                        </KanbanColumn>
                    </section>
                </div>
            </PageState>
            <CustomerDrawer record={drawer ? records[0] : null} onClose={() => setDrawer(false)} />
            <ModalOverlay isOpen={modal} onOpenChange={setModal} isDismissable>
                <Modal className="max-w-md">
                    <Dialog aria-label="Exemplo de modal">
                        <div className="panel form-stack">
                            <h2>Confirmação de ação</h2>
                            <p>Este é um exemplo de modal acessível do Untitled UI.</p>
                            <Button
                                onClick={() => {
                                    setModal(false);
                                    notify("Ação confirmada.");
                                }}
                            >
                                Confirmar
                            </Button>
                            <Button color="secondary" onClick={() => setModal(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
}
