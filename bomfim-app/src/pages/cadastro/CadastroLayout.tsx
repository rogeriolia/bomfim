import { useState } from "react";
import { Download01, Plus } from "@untitledui/icons";
import { Outlet } from "react-router";
import { useApp } from "@/app/store";
import { Button, ContextNavigation, PageHeading, exportCsv } from "@/components/bomfim/ui";
import { NewRegistration } from "@/components/business/NewRegistration";

export default function CadastroLayout() {
    const [open, setOpen] = useState(false);
    const { records } = useApp();
    return (
        <div className="page">
            <PageHeading title="Funil de Cadastro" eyebrow="OPERAÇÃO / DCM" description="Da primeira conexão a um novo cliente. Acompanhe cada etapa.">
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
            </PageHeading>
            <ContextNavigation
                items={["Mapa", "Fluxo", "Kanban", "Lista", "Formulários", "E-mails", "Painéis"].map((label, i) => [
                    label,
                    "/cadastro/" + ["mapa", "fluxo", "kanban", "lista", "formularios", "emails", "paineis"][i],
                ])}
            />
            <Outlet />
            <NewRegistration open={open} onClose={() => setOpen(false)} />
        </div>
    );
}
