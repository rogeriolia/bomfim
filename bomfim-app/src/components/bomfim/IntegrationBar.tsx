import { useEffect, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { NavLink } from "react-router";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/bomfim/ui";

const integrations: [string, string][] = [
    ["Moskit", "/moskit"],
    ["Assinatura Digital", "/assinaturas"],
    ["Receita Federal", "/documentos"],
    ["Documentos", "/documentos"],
];

export function IntegrationBar() {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 1200px)");
        const sync = () => setCompact(media.matches);
        sync();
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
    }, []);

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
                            {integrations.map(([label, path]) => (
                                <Dropdown.Item key={label} href={path}>
                                    {label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            ) : (
                integrations.map(([label, path]) => (
                    <Button key={label} href={path} color="tertiary" size="sm">
                        <span className="tiny-dot" />
                        {label}
                    </Button>
                ))
            )}
            <NavLink to="/design-system" className="design-link">
                Design System ↗
            </NavLink>
        </div>
    );
}
