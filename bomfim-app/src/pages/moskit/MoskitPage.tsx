import { type ReactNode, useEffect, useState } from "react";
import { RefreshCw01 } from "@untitledui/icons";
import { ApiError, api, formatDateTime } from "@/api/client";
import { useApp } from "@/app/store";
import { Button, DataTable, Metric, PageHeading, PageState, Status } from "@/components/bomfim/ui";

export default function MoskitPage() {
    const { records, notify } = useApp();
    const [sync, setSync] = useState(false);
    const [time, setTime] = useState("—");
    const [rows, setRows] = useState<(string | ReactNode)[][]>([]);

    const load = async () => {
        const events = await api.listSyncEvents();
        if (events.length) setTime(formatDateTime(events[0].occurred_at));
        setRows(events.slice(0, 8).map((e) => [e.company, e.operation, formatDateTime(e.occurred_at), <Status>{e.status}</Status>]));
    };

    useEffect(() => {
        void load().catch((e) => notify(e instanceof ApiError ? e.message : "Erro ao carregar sincronizações."));
    }, [notify]);

    return (
        <div className="page">
            <PageHeading title="Moskit" eyebrow="INTEGRAÇÕES" description="Visibilidade sobre a sincronização entre cadastro e relacionamento.">
                <Button
                    size="sm"
                    iconLeading={RefreshCw01}
                    isLoading={sync}
                    onClick={() => {
                        setSync(true);
                        setTimeout(() => {
                            setTime("Agora");
                            setSync(false);
                            notify("Sincronização registrada.");
                            void load();
                        }, 900);
                    }}
                >
                    Sincronizar agora
                </Button>
            </PageHeading>
            <PageState>
                <div className="integration-banner">
                    <div>
                        <h2>Integração disponível</h2>
                        <p>Última sincronização: {time}</p>
                    </div>
                    <Status>Sincronizado</Status>
                </div>
                <div className="metrics">
                    <Metric label="Registros sincronizados" value={records.length} />
                    <Metric label="Pendentes" value="0" />
                    <Metric label="Erros recentes" value="0" />
                </div>
                <div className="section-heading">
                    <h2>Últimas sincronizações</h2>
                </div>
                <DataTable title="Últimas sincronizações" columns={["Empresa", "Operação", "Horário", "Status"]} rows={rows} />
            </PageState>
        </div>
    );
}
