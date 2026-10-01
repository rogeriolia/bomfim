import type { ReactNode } from "react";

export function KanbanColumn({
    title,
    count,
    variant,
    children,
    state = "default",
}: {
    title: string;
    count: number;
    variant: number;
    children?: ReactNode;
    state?: "default" | "empty" | "loading";
}) {
    return (
        <section className={`kanban-column stage-${variant}`}>
            <header>
                <span className="stage-dot" />
                <h2>{title}</h2>
                <span className="count">{count}</span>
            </header>
            <div className="column-cards">
                {state === "loading" ? (
                    <div className="skeleton" />
                ) : state === "empty" ? (
                    <div className="column-empty">Nenhum cadastro nesta etapa</div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}
