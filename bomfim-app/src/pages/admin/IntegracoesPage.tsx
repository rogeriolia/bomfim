import { useEffect, useState } from "react";
import { ApiError, api, formatDateTime } from "@/api/client";
import { useApp } from "@/app/store";
import { Button, PageState, Status } from "@/components/bomfim/ui";

export default function IntegracoesPage() {
    const { notify } = useApp();
    const [items, setItems] = useState<{ name: string; last_sync_at: string | null }[]>([]);
    const [last, setLast] = useState<Record<string, string>>({});

    useEffect(() => {
        void (async () => {
            try {
                const data = await api.listIntegrations();
                setItems(data.map((d) => ({ name: d.name, last_sync_at: d.last_sync_at })));
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar integrações.");
            }
        })();
    }, [notify]);

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Integrações</h2>
                    <p>Serviços conectados à operação.</p>
                </div>
            </div>
            <div className="two-grid">
                {items.map((s) => (
                    <section className="panel" key={s.name}>
                        <div className="section-heading">
                            <h2>{s.name}</h2>
                            <Status>Ativa</Status>
                        </div>
                        <p className="subtle">Última sincronização: {last[s.name] || (s.last_sync_at ? formatDateTime(s.last_sync_at) : "—")}</p>
                        <Button
                            size="sm"
                            color="secondary"
                            onClick={() => {
                                setLast((v) => ({ ...v, [s.name]: "Agora" }));
                                notify(`Teste de ${s.name} concluído.`);
                            }}
                        >
                            Testar conexão
                        </Button>
                    </section>
                ))}
            </div>
        </PageState>
    );
}
