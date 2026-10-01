import { useState } from "react";
import { FilterLines, Rows01, SearchLg } from "@untitledui/icons";
import { useApp } from "@/app/store";
import { Button, Choice, Input, PageState } from "@/components/bomfim/ui";
import { CustomerDrawer } from "@/components/business/CustomerDrawer";
import { KanbanColumn } from "@/components/business/KanbanColumn";
import { RegistrationCard } from "@/components/business/RegistrationCard";
import { stages } from "@/data/mocks/registrations";

export default function KanbanPage() {
    const { records } = useApp();
    const [search, setSearch] = useState("");
    const [promoter, setPromoter] = useState("all");
    const [mobileStage, setMobileStage] = useState("0");
    const [filter, setFilter] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const shown = records.filter(
        (r) => (r.name + r.cnpj + r.owner).toLowerCase().includes(search.toLowerCase()) && (promoter === "all" || r.promoter === promoter),
    );
    return (
        <PageState>
            <div className="kanban-toolbar">
                <div className="view-label">
                    <Rows01 />
                    <strong>Quadro de cadastros</strong>
                    <span>{shown.length} cadastros</span>
                </div>
                <div className="actions">
                    <Input icon={SearchLg} size="sm" placeholder="Buscar cadastro..." value={search} onChange={setSearch} />
                    <Button size="sm" color="secondary" iconLeading={FilterLines} onClick={() => setFilter(!filter)} aria-expanded={filter}>
                        Filtros{promoter !== "all" ? " · 1" : ""}
                    </Button>
                </div>
            </div>
            {filter && (
                <div className="filter-panel">
                    <Choice
                        label="Promotor"
                        value={promoter}
                        onChange={setPromoter}
                        items={[
                            { id: "all", label: "Todos os promotores" },
                            ...Array.from(new Set(records.map((r) => r.promoter))).map((p) => ({ id: p, label: p })),
                        ]}
                    />
                    <Button
                        size="sm"
                        color="tertiary"
                        onClick={() => {
                            setPromoter("all");
                            setSearch("");
                        }}
                    >
                        Limpar filtros
                    </Button>
                </div>
            )}
            <div className="mobile-stage">
                <Choice label="Etapa" value={mobileStage} onChange={setMobileStage} items={stages.map((s, i) => ({ id: String(i), label: s }))} />
            </div>
            <div className="kanban" data-mobile-stage={mobileStage}>
                {stages.map((s, i) => (
                    <div key={s} className={`column-wrap ${Number(mobileStage) === i ? "mobile-active" : ""}`}>
                        <KanbanColumn
                            title={s}
                            count={shown.filter((r) => r.stage === i).length}
                            variant={i}
                            state={shown.some((r) => r.stage === i) ? "default" : "empty"}
                        >
                            {shown
                                .filter((r) => r.stage === i)
                                .map((r) => (
                                    <RegistrationCard key={r.id} record={r} onSelect={() => setSelected(r.id)} />
                                ))}
                        </KanbanColumn>
                    </div>
                ))}
            </div>
            <CustomerDrawer record={records.find((r) => r.id === selected) || null} onClose={() => setSelected(null)} />
        </PageState>
    );
}
