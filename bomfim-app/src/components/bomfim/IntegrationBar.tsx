import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { useApp } from "@/app/store";
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
    if (state === "ok") return "Conectado";
    if (state === "error") return detail || "Indisponível";
    return "Verificando…";
}

export function IntegrationBar() {
    const { user, integrationsAccess, refreshIntegrationsAccess } = useApp();
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 1200px)");
        const sync = () => setCompact(media.matches);
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
        if (!user) return;
        const tick = () => void refreshIntegrationsAccess(true);
        tick();
        const id = window.setInterval(tick, POLL_MS);
        const onFocus = () => void refreshIntegrationsAccess(true);
        window.addEventListener("focus", onFocus);
        return () => {
            window.clearInterval(id);
            window.removeEventListener("focus", onFocus);
        };
    }, [user, refreshIntegrationsAccess]);

    const statusByName = useMemo(() => {
        const next: Record<string, { state: DotState; detail?: string }> = {};
        if (integrationsAccess?.integrations) {
            for (const row of integrationsAccess.integrations) {
                next[row.name] = {
                    state: row.ok ? "ok" : "error",
                    detail: row.detail,
                };
            }
        }
        return next;
    }, [integrationsAccess]);

    const resolveState = (name: string): { state: DotState; detail?: string } =>
        statusByName[name] ?? { state: "unknown" };

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
