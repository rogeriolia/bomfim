import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

export function KanbanColumn({
    title,
    count,
    variant,
    children,
    state = "default",
    footer,
}: {
    title: string;
    count: number;
    variant: number;
    children?: ReactNode;
    state?: "default" | "empty" | "loading";
    footer?: ReactNode;
}) {
    return (
        <section className={`kanban-column stage-${variant}`}>
            <header>
                <span className={cx("stage-dot", count === 0 && "stage-dot--muted")} />
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
            {footer && <div className="kanban-column-footer">{footer}</div>}
        </section>
    );
}
