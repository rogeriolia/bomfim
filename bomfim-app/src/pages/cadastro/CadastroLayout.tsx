import { useState } from "react";
import { Download01, Plus } from "@untitledui/icons";
import { Outlet } from "react-router";
import { useApp } from "@/app/store";
import { Button, ContextNavigation, exportCsv } from "@/components/bomfim/ui";
import { NewRegistration } from "@/components/business/NewRegistration";

const cadastroTabs = ["Mapa", "Fluxo", "Kanban", "Lista", "Formulários", "E-mails", "Painéis"].map((label, i) => [
    label,
    "/cadastro/" + ["mapa", "fluxo", "kanban", "lista", "formularios", "emails", "paineis"][i],
] as [string, string]);

export default function CadastroLayout() {
    const [open, setOpen] = useState(false);
    const { records } = useApp();
    return (
        <div className="page page--cadastro">
            <div className="cadastro-workspace-bar">
                <ContextNavigation items={cadastroTabs} />
                <div className="actions">
                    <Button
                        color="secondary"
                        size="sm"
                        iconLeading={Download01}
                        onClick={() =>
                            exportCsv(
                                "cadastros",
                                ["Empresa", "CNPJ", "Etapa"],
                                records.map((r) => [r.name, r.cnpj, r.stage]),
                            )
                        }
                    >
                        Exportar
                    </Button>
                    <Button size="sm" iconLeading={Plus} onClick={() => setOpen(true)}>
                        Novo cadastro
                    </Button>
                </div>
            </div>
            <Outlet />
            <NewRegistration open={open} onClose={() => setOpen(false)} />
        </div>
    );
}
