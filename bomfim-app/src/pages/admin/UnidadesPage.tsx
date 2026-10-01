import { useEffect, useState } from "react";
import { ApiError, api } from "@/api/client";
import { useApp } from "@/app/store";
import { DataTable, PageState, Status } from "@/components/bomfim/ui";

export default function UnidadesPage() {
    const { notify } = useApp();
    const [rows, setRows] = useState<string[][]>([]);

    useEffect(() => {
        void (async () => {
            try {
                const units = await api.listUnits();
                setRows(units.map((u) => [u.name, u.code, u.locality, u.responsible, u.status === "active" ? "Ativa" : u.status]));
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar unidades.");
            }
        })();
    }, [notify]);

    return (
        <PageState>
            <div className="section-heading">
                <h2>Unidades da operação</h2>
            </div>
            <DataTable
                title="Unidades"
                columns={["Unidade", "Código", "Localidade", "Responsável", "Status"]}
                rows={rows.map((r) => [r[0], r[1], r[2], r[3], <Status>{r[4]}</Status>])}
            />
        </PageState>
    );
}
