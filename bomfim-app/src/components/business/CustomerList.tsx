import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useApp } from "@/app/store";
import { Button, Choice, DataTable, PageState, SearchFilter, Status } from "@/components/bomfim/ui";
import { registrationAnexoAvailable, registrationAnexoTotal, stageLabel, stages } from "@/data/mocks/registrations";
import { RegistrationAnexoCount } from "@/components/business/registration-anexos-list";
import { CompanyIdentity } from "./RegistrationCard";

export function CustomerList() {
    const { records, recordsLoaded } = useApp();
    const [searchParams] = useSearchParams();
    const stageFromUrl = searchParams.get("stage");
    const [search, setSearch] = useState("");
    const [stage, setStage] = useState(() => (stageFromUrl !== null && stageFromUrl !== "" ? stageFromUrl : "all"));
    const [promoter, setPromoter] = useState("all");
    const [unit, setUnit] = useState("all");
    const [table, setTable] = useState("all");
    const [page, setPage] = useState(0);
    useEffect(() => {
        if (stageFromUrl !== null && stageFromUrl !== "") {
            setStage(stageFromUrl);
            setPage(0);
        }
    }, [stageFromUrl]);
    const rows = records.filter(
        (r) =>
            (r.name + r.cnpj + r.owner + (r.usuario_ssw || "")).toLowerCase().includes(search.toLowerCase()) &&
            (stage === "all" || r.stage === Number(stage)) &&
            (promoter === "all" || r.promoter === promoter) &&
            (unit === "all" || r.unit === unit) &&
            (table === "all" || (r.tipo_cobranca || r.table) === table),
    );
    const pages = Math.max(1, Math.ceil(rows.length / 8));
    const current = Math.min(page, pages - 1);
    const anexoTotal = (r: (typeof rows)[0]) => registrationAnexoTotal(r);
    const anexoAvail = (r: (typeof rows)[0]) => registrationAnexoAvailable(r);
    const withAnexos = rows.filter((r) => anexoTotal(r) > 0).length;
    const anexoFilesTotal = rows.reduce((n, r) => n + anexoAvail(r), 0);
    const options = (v: string[]) => [{ id: "all", label: "Todos" }, ...Array.from(new Set(v)).map((s) => ({ id: s, label: s }))];
    return (
        <PageState>
            {!recordsLoaded && <p className="subtle">Carregando cadastros da base…</p>}
            <SearchFilter
                search={search}
                setSearch={(v) => {
                    setSearch(v);
                    setPage(0);
                }}
            >
                <Choice
                    label="Status"
                    value={stage}
                    onChange={setStage}
                    items={[{ id: "all", label: "Todos os status" }, ...stages.map((s, i) => ({ id: String(i), label: s }))]}
                />
                <Choice label="Promotor" value={promoter} onChange={setPromoter} items={options(records.map((r) => r.promoter))} />
                <Choice label="Unidade" value={unit} onChange={setUnit} items={options(records.map((r) => r.unit))} />
                <Choice
                    label="Tipo cobrança"
                    value={table}
                    onChange={setTable}
                    items={options(records.map((r) => r.tipo_cobranca || r.table))}
                />
            </SearchFilter>
            <DataTable
                title="Clientes"
                columns={["Empresa", "CNPJ", "Responsável", "Promotor", "Usuário SSW", "Tipo cobrança", "Anexos", "Status", "Atualização"]}
                rows={rows.slice(current * 8, current * 8 + 8).map((r) => [
                    <Link to={"/clientes/" + r.id}>
                        <CompanyIdentity name={r.name} />
                    </Link>,
                    r.cnpj,
                    r.owner,
                    r.promoter || "Usuário Bomfim",
                    r.usuario_ssw || "—",
                    <span className="tipo-cobranca">{r.tipo_cobranca || r.table || "—"}</span>,
                    <RegistrationAnexoCount
                        registrationId={r.id}
                        anexos={r.anexos}
                        anexosCount={r.anexos_count}
                        anexosAvailableCount={r.anexos_available_count}
                    />,
                    <Status>{stageLabel(r.stage)}</Status>,
                    r.updated.split("-").reverse().join("/"),
                ])}
            />
            <div className="pagination">
                <span>
                    {rows.length} registros · {withAnexos} com anexos ({anexoFilesTotal} arquivos no servidor) · Página {current + 1} de{" "}
                    {pages}
                </span>
                <div className="actions">
                    <Button color="secondary" size="sm" isDisabled={current === 0} onClick={() => setPage(current - 1)}>
                        Anterior
                    </Button>
                    <Button color="secondary" size="sm" isDisabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                        Próxima
                    </Button>
                </div>
            </div>
        </PageState>
    );
}
