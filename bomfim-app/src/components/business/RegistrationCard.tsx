import { MessageSquare01, Paperclip, RefreshCw01 } from "@untitledui/icons";
import type { Registration } from "@/data/mocks/registrations";

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
export function RegistrationCard({ record, onSelect }: { record: Registration; onSelect: () => void }) {
    return (
        <button className="registration-card" onClick={onSelect}>
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
        </button>
    );
}
