import type { DragEvent, ReactNode } from "react";
import { cx } from "@/utils/cx";

export function KanbanColumn({
    title,
    count,
    variant,
    children,
    state = "default",
    footer,
    isDropTarget = false,
    onDragOver,
    onDragLeave,
    onDrop,
}: {
    title: string;
    count: number;
    variant: number;
    children?: ReactNode;
    state?: "default" | "loading";
    footer?: ReactNode;
    isDropTarget?: boolean;
    onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}) {
    return (
        <section className={cx("kanban-column", `stage-${variant}`, isDropTarget && "kanban-column--drop-target")}>
            <header>
                <span className={cx("stage-dot", count === 0 && "stage-dot--muted")} />
                <h2>{title}</h2>
                <span className="count">{count}</span>
            </header>
            <div className="column-cards" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                {state === "loading" ? (
                    <div className="skeleton" />
                ) : (
                    <>
                        {children}
                        {count === 0 && <div className="column-empty">Nenhum cadastro nesta etapa</div>}
                    </>
                )}
            </div>
            {footer && <div className="kanban-column-footer">{footer}</div>}
        </section>
    );
}
