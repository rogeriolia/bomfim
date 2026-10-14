import { MessageSquare01, Paperclip, RefreshCw01 } from "@untitledui/icons";
import { useRef, type DragEvent, type KeyboardEvent } from "react";
import type { Registration } from "@/data/mocks/registrations";
import { cx } from "@/utils/cx";

export const REGISTRATION_DRAG_MIME = "application/x-bomfim-registration-id";

export function CompanyIdentity({ name }: { name: string }) {
    return (
        <div className="company-identity">
            <span className="company-icon">{name.slice(0, 2).toUpperCase()}</span>
            <strong>{name}</strong>
        </div>
    );
}
export function ActivityCounter({ documents, comments }: { documents: number; comments: number }) {
    return (
        <div className="activity-counter">
            <span title="Moskit sincronizado">
                <RefreshCw01 /> Sincronizado
            </span>
            <span>
                <Paperclip />
                {documents}
            </span>
            <span>
                <MessageSquare01 />
                {comments}
            </span>
        </div>
    );
}

type RegistrationCardProps = {
    record: Registration;
    onSelect: () => void;
    draggable?: boolean;
    isDragging?: boolean;
    onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
};

export function RegistrationCard({ record, onSelect, draggable = false, isDragging = false, onDragStart, onDragEnd }: RegistrationCardProps) {
    const skipClickRef = useRef(false);

    const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData(REGISTRATION_DRAG_MIME, record.id);
        event.dataTransfer.setData("text/plain", record.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(event);
    };

    const handleDragEnd = (event: DragEvent<HTMLDivElement>) => {
        skipClickRef.current = true;
        onDragEnd?.(event);
    };

    const handleClick = () => {
        if (skipClickRef.current) {
            skipClickRef.current = false;
            return;
        }
        onSelect();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={cx("registration-card", isDragging && "registration-card--dragging")}
            draggable={draggable}
            onDragStart={draggable ? handleDragStart : undefined}
            onDragEnd={draggable ? handleDragEnd : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div className="card-top">
                <span className="record-id">CAD-{record.id.padStart(4, "0")}</span>
                <span className="card-date">{record.updated.slice(8)}/09</span>
            </div>
            <h3>{record.name}</h3>
            <p className="cnpj">{record.cnpj}</p>
            <div className="card-people">
                <span>Promotor</span>
                <strong>
                    <i>
                        {record.promoter
                            .split(" ")
                            .map((x) => x[0])
                            .join("")}
                    </i>
                    {record.promoter}
                </strong>
            </div>
            <div className="card-detail">
                <span>Responsável</span>
                <b>{record.owner}</b>
            </div>
            <div className="card-detail">
                <span>Tabela de preços</span>
                <b>{record.table}</b>
            </div>
            <ActivityCounter documents={record.documents} comments={record.comments} />
        </div>
    );
}
