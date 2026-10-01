import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ApiError, api, formatDate } from "@/api/client";
import { useApp } from "@/app/store";
import { Button, Choice, DataTable, ExportButton, PageHeading, PageState, SearchFilter, Status, exportCsv } from "@/components/bomfim/ui";

type SigRow = { company: string; document: string; sent_at: string; signatories: string; status: string; last_updated_at: string };

export default function AssinaturasPage() {
    const { notify } = useApp();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [rows, setRows] = useState<SigRow[]>([]);
    const statuses = ["Aguardando", "Visualizado", "Parcialmente assinado", "Concluído", "Expirado", "Cancelado"];

    useEffect(() => {
        void (async () => {
            try {
                setRows(await api.listSignatures());
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar assinaturas.");
            }
        })();
    }, [notify]);

    const filtered = useMemo(
        () => rows.filter((r) => r.company.toLowerCase().includes(search.toLowerCase()) && (status === "all" || r.status === status)),
        [rows, search, status],
    );

    const tableRows: (string | ReactNode)[][] = filtered.map((r) => [
        r.company,
        r.document,
        formatDate(r.sent_at),
        r.signatories,
        <Status>{r.status}</Status>,
        formatDate(r.last_updated_at),
        <Button color="link-gray" size="sm" isDisabled={["Concluído", "Cancelado"].includes(r.status)}>
            Reenviar
        </Button>,
    ]);

    return (
        <div className="page">
            <PageHeading title="Assinaturas" eyebrow="DOCUMENTAÇÃO" description="Acompanhe contratos e mantenha as assinaturas em dia.">
                <ExportButton
                    onClick={() =>
                        exportCsv(
                            "assinaturas",
                            ["Empresa", "Status"],
                            filtered.map((r) => [r.company, r.status]),
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
                    rows={tableRows}
                />
            </PageState>
        </div>
    );
}
