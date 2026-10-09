import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { api } from "@/api/client";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/bomfim/ui";
import { cx } from "@/utils/cx";

const integrations: { name: string; label: string; path: string }[] = [
    { name: "Moskit", label: "Moskit", path: "/moskit" },
    { name: "Pipefy", label: "Pipefy", path: "/pipefy" },
    { name: "Click Sign", label: "Click Sign", path: "/assinaturas" },
    { name: "Receita Federal", label: "Receita Federal", path: "/documentos" },
    { name: "Zapier", label: "Zapier", path: "/zapier" },
];

const POLL_MS = 60_000;

type DotState = "unknown" | "ok" | "error";

function dotClass(state: DotState): string {
    return cx("tiny-dot", state === "error" && "tiny-dot--error", state === "unknown" && "tiny-dot--pending");
}

function dotTitle(state: DotState, detail?: string): string | undefined {
    if (state === "ok") return "Conexão verificada";
    if (state === "error") return detail || "Integração indisponível";
    return "Verificando conexão…";
}

export function IntegrationBar() {
    const [compact, setCompact] = useState(false);
    const [statusByName, setStatusByName] = useState<Record<string, { state: DotState; detail?: string }>>({});

    const loadStatus = useCallback(async () => {
        try {
            const data = await api.getIntegrationAccessStatus();
            const next: Record<string, { state: DotState; detail?: string }> = {};
            for (const row of data.integrations) {
                next[row.name] = {
                    state: row.ok ? "ok" : "error",
                    detail: row.detail,
                };
            }
            setStatusByName(next);
        } catch {
            const next: Record<string, { state: DotState; detail?: string }> = {};
            for (const { name } of integrations) {
                next[name] = { state: "error", detail: "API da operação indisponível." };
            }
            setStatusByName(next);
        }
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 1200px)");
        const sync = () => setCompact(media.matches);
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
        void loadStatus();
        const id = window.setInterval(() => void loadStatus(), POLL_MS);
        return () => window.clearInterval(id);
    }, [loadStatus]);

    const resolveState = useMemo(
        () =>
            (name: string): { state: DotState; detail?: string } =>
                statusByName[name] ?? { state: "unknown" },
        [statusByName],
    );

    return (
        <div className="integration-bar">
            <span className="integration-label">CONECTADO À OPERAÇÃO</span>
            {compact ? (
                <Dropdown.Root>
                    <Button color="tertiary" size="sm" iconTrailing={ChevronDown}>
                        Integrações
                    </Button>
                    <Dropdown.Popover>
                        <Dropdown.Menu aria-label="Integrações da operação">
                            {integrations.map(({ name, label, path }) => {
                                const { state, detail } = resolveState(name);
                                return (
                                    <Dropdown.Item key={name} href={path}>
                                        <span className="integration-bar-dropdown-item">
                                            <span className={dotClass(state)} title={dotTitle(state, detail)} aria-hidden />
                                            {label}
                                        </span>
                                    </Dropdown.Item>
                                );
                            })}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            ) : (
                integrations.map(({ name, label, path }) => {
                    const { state, detail } = resolveState(name);
                    return (
                        <Button key={name} href={path} color="tertiary" size="sm">
                            <span className={dotClass(state)} title={dotTitle(state, detail)} />
                            {label}
                        </Button>
                    );
                })
            )}
        </div>
    );
}
