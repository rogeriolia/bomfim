import { type ReactNode, useEffect, useState } from "react";
import { ApiError, api, formatDateTime } from "@/api/client";
import { useApp } from "@/app/store";
import { DataTable, PageState, Status } from "@/components/bomfim/ui";

export default function AuditoriaPage() {
    const { notify } = useApp();
    const [rows, setRows] = useState<(string | ReactNode)[][]>([]);

    useEffect(() => {
        void (async () => {
            try {
                const logs = await api.listAuditLogs();
                setRows(logs.map((l) => [formatDateTime(l.occurred_at), l.user, l.event, l.resource, <Status>{l.result}</Status>]));
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar auditoria.");
            }
        })();
    }, [notify]);

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Auditoria</h2>
                    <p>Eventos registrados pelo sistema.</p>
                </div>
            </div>
            <DataTable title="Auditoria" columns={["Data e hora", "Usuário", "Evento", "Recurso", "Resultado"]} rows={rows} />
        </PageState>
    );
}
