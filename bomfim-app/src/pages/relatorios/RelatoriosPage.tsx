import { useApp } from "@/app/store";
import { Button, DataTable, Metric, PageHeading, PageState, exportCsv } from "@/components/bomfim/ui";
import { stages } from "@/data/mocks/registrations";

export default function RelatoriosPage() {
    const { records } = useApp();
    return (
        <div className="page">
            <PageHeading title="Relatórios" eyebrow="INTELIGÊNCIA OPERACIONAL" description="Indicadores e exportações para acompanhar os resultados." />
            <PageState>
                <div className="metrics">
                    <Metric label="Cadastros analisados" value={records.length} />
                    <Metric label="Empresas aprovadas" value={records.filter((r) => r.stage === 3).length} />
                    <Metric label="Unidades" value={3} />
                </div>
                <DataTable
                    title="Relatórios disponíveis"
                    columns={["Relatório", "Descrição", "Formato", "Ação"]}
                    rows={["Cadastros por etapa", "Clientes por unidade", "Desempenho dos promotores"].map((s, i) => [
                        s,
                        ["Distribuição do funil de cadastro", "Carteira por unidade operacional", "Acompanhamento por promotor"][i],
                        "CSV",
                        <Button
                            color="link-color"
                            size="sm"
                            onClick={() =>
                                exportCsv(
                                    s,
                                    ["Empresa", "CNPJ", "Etapa", "Unidade", "Promotor"],
                                    records.map((r) => [r.name, r.cnpj, stages[r.stage], r.unit, r.promoter]),
                                )
                            }
                        >
                            Baixar relatório
                        </Button>,
                    ])}
                />
            </PageState>
        </div>
    );
}
