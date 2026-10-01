import { useState } from "react";
import { useApp } from "@/app/store";
import { Button, Choice, DataTable, ExportButton, PageHeading, PageState, SearchFilter, Status, exportCsv } from "@/components/bomfim/ui";

export default function AssinaturasPage() {
    const { records, notify } = useApp();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sent, setSent] = useState<string[]>([]);
    const statuses = ["Aguardando", "Visualizado", "Parcialmente assinado", "Concluído", "Expirado", "Cancelado"];
    const rows = records
        .slice(0, 12)
        .map((r, i) => ({ ...r, status: statuses[i % 6] }))
        .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) && (status === "all" || r.status === status));
    return (
        <div className="page">
            <PageHeading title="Assinaturas" eyebrow="DOCUMENTAÇÃO" description="Acompanhe contratos e mantenha as assinaturas em dia.">
                <ExportButton
                    onClick={() =>
                        exportCsv(
                            "assinaturas",
                            ["Empresa", "Status"],
                            rows.map((r) => [r.name, r.status]),
                        )
                    }
                />
            </PageHeading>
            <PageState>
                <SearchFilter search={search} setSearch={setSearch}>
                    <Choice
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        items={[{ id: "all", label: "Todos" }, ...statuses.map((s) => ({ id: s, label: s }))]}
                    />
                </SearchFilter>
                <DataTable
                    title="Assinaturas"
                    columns={["Empresa", "Documento", "Enviado em", "Signatários", "Status", "Última atualização", "Ação"]}
                    rows={rows.map((r) => [
                        r.name,
                        "Contrato de transporte",
                        "28/09/2026",
                        r.owner,
                        <Status>{r.status}</Status>,
                        sent.includes(r.id) ? "Agora (simulado)" : "30/09/2026",
                        <Button
                            color="link-gray"
                            size="sm"
                            isDisabled={["Concluído", "Cancelado"].includes(r.status)}
                            onClick={() => {
                                setSent((s) => [...s, r.id]);
                                notify("Lembrete simulado. Nenhuma mensagem foi enviada.");
                            }}
                        >
                            Lembrar
                        </Button>,
                    ])}
                />
            </PageState>
        </div>
    );
}
