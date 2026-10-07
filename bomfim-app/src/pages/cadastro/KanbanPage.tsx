import { useMemo, useState } from "react";
import { FilterLines, Rows01, SearchLg } from "@untitledui/icons";
import { Link } from "react-router";
import { useApp } from "@/app/store";
import { Button, Choice, Input, PageState } from "@/components/bomfim/ui";
import { CustomerDrawer } from "@/components/business/CustomerDrawer";
import { KanbanColumn } from "@/components/business/KanbanColumn";
import { RegistrationCard } from "@/components/business/RegistrationCard";
import { stages } from "@/data/mocks/registrations";

const KANBAN_PREVIEW_LIMIT = 25;
const IMBALANCE_THRESHOLD = 0.8;

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

    const dominantStage = useMemo(() => {
        if (!shown.length) return null;
        let best = 0;
        let bestCount = 0;
        for (let i = 0; i < stages.length; i++) {
            const n = shown.filter((r) => r.stage === i).length;
            if (n > bestCount) {
                bestCount = n;
                best = i;
            }
        }
        return bestCount / shown.length >= IMBALANCE_THRESHOLD ? { stage: best, count: bestCount, pct: Math.round((bestCount / shown.length) * 100) } : null;
    }, [shown]);

    return (
        <PageState>
            {dominantStage && (
                <div className="kanban-imbalance-banner" role="status">
                    <span>
                        {dominantStage.pct}% dos cadastros estão em &quot;{stages[dominantStage.stage]}&quot;. O quadro mostra até {KANBAN_PREVIEW_LIMIT}{" "}
                        cards por coluna.
                    </span>
                    <Button color="link-color" size="sm" href="/cadastro/paineis">
                        Abrir Painéis
                    </Button>
                </div>
            )}
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
                {stages.map((s, i) => {
                    const inStage = shown.filter((r) => r.stage === i);
                    const count = inStage.length;
                    const preview = inStage.slice(0, KANBAN_PREVIEW_LIMIT);
                    return (
                        <div key={s} className={`column-wrap ${Number(mobileStage) === i ? "mobile-active" : ""}`}>
                            <KanbanColumn
                                title={s}
                                count={count}
                                variant={i}
                                state={count > 0 ? "default" : "empty"}
                                footer={
                                    count > KANBAN_PREVIEW_LIMIT ? (
                                        <Link to={`/cadastro/lista?stage=${i}`}>Ver todos ({count}) →</Link>
                                    ) : undefined
                                }
                            >
                                {preview.map((r) => (
                                    <RegistrationCard key={r.id} record={r} onSelect={() => setSelected(r.id)} />
                                ))}
                            </KanbanColumn>
                        </div>
                    );
                })}
            </div>
            <CustomerDrawer record={records.find((r) => r.id === selected) || null} onClose={() => setSelected(null)} />
        </PageState>
    );
}
