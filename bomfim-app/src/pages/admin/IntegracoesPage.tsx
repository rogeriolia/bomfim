import { useCallback, useEffect, useState } from "react";
import { ApiError, api, formatDateTime } from "@/api/client";
import { useApp } from "@/app/store";
import { Button, PageState, Status } from "@/components/bomfim/ui";

export default function IntegracoesPage() {
    const { notify } = useApp();
    const [items, setItems] = useState<{ name: string; last_sync_at: string | null }[]>([]);
    const [accessByName, setAccessByName] = useState<Record<string, { ok: boolean; detail?: string }>>({});
    const [testing, setTesting] = useState<string | null>(null);

    const loadAccess = useCallback(async (refresh = false) => {
        try {
            const data = await api.getIntegrationAccessStatus(refresh);
            const next: Record<string, { ok: boolean; detail?: string }> = {};
            for (const row of data.integrations) {
                next[row.name] = { ok: row.ok, detail: row.detail };
            }
            setAccessByName(next);
        } catch {
            setAccessByName({});
        }
    }, []);

    useEffect(() => {
        void (async () => {
            try {
                const data = await api.listIntegrations();
                setItems(data.map((d) => ({ name: d.name, last_sync_at: d.last_sync_at })));
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar integrações.");
            }
        })();
        void loadAccess();
    }, [notify, loadAccess]);

    const testConnection = async (name: string) => {
        setTesting(name);
        try {
            const data = await api.getIntegrationAccessStatus(true);
            const row = data.integrations.find((i) => i.name === name);
            const next: Record<string, { ok: boolean; detail?: string }> = {};
            for (const r of data.integrations) {
                next[r.name] = { ok: r.ok, detail: r.detail };
            }
            setAccessByName(next);
            if (row?.ok) {
                notify(`Conexão com ${name} verificada.`);
            } else {
                notify(row?.detail || `Falha ao conectar com ${name}.`);
            }
        } catch (e) {
            notify(e instanceof ApiError ? e.message : `Erro ao testar ${name}.`);
        } finally {
            setTesting(null);
        }
    };

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Integrações</h2>
                    <p>Serviços conectados à operação.</p>
                </div>
            </div>
            <div className="two-grid">
                {items.map((s) => {
                    const access = accessByName[s.name];
                    const active = access?.ok ?? false;
                    return (
                        <section className="panel" key={s.name}>
                            <div className="section-heading">
                                <h2>{s.name}</h2>
                                <Status>{access === undefined ? "—" : active ? "Ativa" : "Inativa"}</Status>
                            </div>
                            <p className="subtle">
                                Última sincronização: {s.last_sync_at ? formatDateTime(s.last_sync_at) : "—"}
                            </p>
                            {!active && access?.detail ? <p className="subtle">{access.detail}</p> : null}
                            <Button
                                size="sm"
                                color="secondary"
                                isLoading={testing === s.name}
                                isDisabled={testing !== null && testing !== s.name}
                                onClick={() => void testConnection(s.name)}
                            >
                                Testar conexão
                            </Button>
                        </section>
                    );
                })}
            </div>
        </PageState>
    );
}
