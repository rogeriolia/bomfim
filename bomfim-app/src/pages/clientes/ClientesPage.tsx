import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { useApp } from "@/app/store";
import { Button, ExportButton, PageHeading, exportCsv } from "@/components/bomfim/ui";
import { CustomerList } from "@/components/business/CustomerList";
import { NewRegistration } from "@/components/business/NewRegistration";

export default function ClientesPage() {
    const { records } = useApp();
    const [open, setOpen] = useState(false);
    return (
        <div className="page">
            <PageHeading title="Clientes" eyebrow="RELACIONAMENTO" description="Gerencie empresas e seus dados cadastrais.">
                <ExportButton
                    onClick={() =>
                        exportCsv(
                            "clientes",
                            ["Empresa", "CNPJ"],
                            records.map((r) => [r.name, r.cnpj]),
                        )
                    }
                />
                <Button size="sm" iconLeading={Plus} onClick={() => setOpen(true)}>
                    Novo cliente
                </Button>
            </PageHeading>
            <CustomerList />
            <NewRegistration open={open} onClose={() => setOpen(false)} />
        </div>
    );
}
