import { useMemo, useState, type DragEvent } from "react";
import { FilterLines, Rows01, SearchLg } from "@untitledui/icons";
import { Link } from "react-router";
import { useApp } from "@/app/store";
import { ApiError } from "@/api/client";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button, Choice, Input, PageState } from "@/components/bomfim/ui";
import { CustomerDrawer } from "@/components/business/CustomerDrawer";
import { KanbanColumn } from "@/components/business/KanbanColumn";
import { REGISTRATION_DRAG_MIME, RegistrationCard } from "@/components/business/RegistrationCard";
import { stages } from "@/data/mocks/registrations";

const KANBAN_PREVIEW_LIMIT = 25;
const IMBALANCE_THRESHOLD = 0.8;

type PendingMove = {
    recordId: string;
    recordName: string;
    fromStage: number;
    toStage: number;
};

export default function KanbanPage() {
    const { records, update, notify } = useApp();
    const [search, setSearch] = useState("");
    const [promoter, setPromoter] = useState("all");
    const [mobileStage, setMobileStage] = useState("0");
    const [filter, setFilter] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<number | null>(null);
    const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const [moveSaving, setMoveSaving] = useState(false);

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

    const handleColumnDragOver = (stageIndex: number) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOverStage(stageIndex);
    };

    const handleColumnDragLeave = (event: DragEvent<HTMLDivElement>) => {
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) return;
        setDragOverStage(null);
    };

    const handleColumnDrop = (toStage: number) => (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragOverStage(null);
        setDraggingCardId(null);

        const recordId = event.dataTransfer.getData(REGISTRATION_DRAG_MIME) || event.dataTransfer.getData("text/plain");
        if (!recordId) return;

        const record = records.find((r) => r.id === recordId);
        if (!record) return;

        const fromStage = record.stage ?? 0;
        if (fromStage === toStage) return;

        setPendingMove({
            recordId,
            recordName: record.name,
            fromStage,
            toStage,
        });
    };

    const closePendingMove = () => {
        if (moveSaving) return;
        setPendingMove(null);
    };

    const confirmPendingMove = async () => {
        if (!pendingMove || moveSaving) return;
        setMoveSaving(true);
        try {
            await update(pendingMove.recordId, { stage: pendingMove.toStage });
            notify("Etapa atualizada.");
            setPendingMove(null);
        } catch (e) {
            notify(e instanceof ApiError ? e.message : "Não foi possível atualizar a etapa.");
        } finally {
            setMoveSaving(false);
        }
    };

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
                                isDropTarget={dragOverStage === i}
                                onDragOver={handleColumnDragOver(i)}
                                onDragLeave={handleColumnDragLeave}
                                onDrop={handleColumnDrop(i)}
                                footer={
                                    count > KANBAN_PREVIEW_LIMIT ? (
                                        <Link to={`/cadastro/lista?stage=${i}`}>Ver todos ({count}) →</Link>
                                    ) : undefined
                                }
                            >
                                {preview.map((r) => (
                                    <RegistrationCard
                                        key={r.id}
                                        record={r}
                                        draggable
                                        isDragging={draggingCardId === r.id}
                                        onDragStart={() => setDraggingCardId(r.id)}
                                        onDragEnd={() => {
                                            setDraggingCardId(null);
                                            setDragOverStage(null);
                                        }}
                                        onSelect={() => setSelected(r.id)}
                                    />
                                ))}
                            </KanbanColumn>
                        </div>
                    );
                })}
            </div>
            <CustomerDrawer record={records.find((r) => r.id === selected) || null} onClose={() => setSelected(null)} />
            <ModalOverlay isOpen={pendingMove !== null} onOpenChange={(open) => !open && closePendingMove()} isDismissable={!moveSaving}>
                <Modal className="max-w-md">
                    <Dialog aria-label="Confirmar mudança de etapa">
                        {pendingMove && (
                            <div className="panel form-stack">
                                <h2>Confirmar mudança de etapa</h2>
                                <p>
                                    Mover <strong>{pendingMove.recordName}</strong> de &quot;{stages[pendingMove.fromStage]}&quot; para &quot;
                                    {stages[pendingMove.toStage]}&quot;?
                                </p>
                                <Button isLoading={moveSaving} onClick={() => void confirmPendingMove()}>
                                    Confirmar
                                </Button>
                                <Button color="secondary" isDisabled={moveSaving} onClick={closePendingMove}>
                                    Cancelar
                                </Button>
                            </div>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </PageState>
    );
}
