import { useApp } from "@/app/store";
import { FunnelStagePie } from "@/components/business/funnel-stage-pie";
import { DataTable, Metric, PageState } from "@/components/bomfim/ui";

export default function PaineisPage() {
    const { records } = useApp();
    return (
        <PageState>
            <div className="metrics">
                <Metric label="Cadastros no período" value={records.length} />
                <Metric label="Aguardando validação" value={records.filter((r) => r.stage === 1).length} />
                <Metric label="Conversão" value={Math.round((records.filter((r) => r.stage === 3).length / Math.max(1, records.length)) * 100) + "%"} />
            </div>
            <section className="panel funnel-pie-wrap">
                <h2>Distribuição por etapa</h2>
                <p className="subtle">Visão proporcional do funil de cadastro</p>
                <FunnelStagePie records={records} compact />
            </section>
            <DataTable
                title="Desempenho por promotor"
                columns={["Promotor", "Cadastros", "Finalizados", "Em andamento"]}
                rows={["Ana Ferreira", "Rafael Martins", "Camila Santos"].map((p) => [
                    p,
                    records.filter((r) => r.promoter === p).length,
                    records.filter((r) => r.promoter === p && r.stage === 3).length,
                    records.filter((r) => r.promoter === p && r.stage < 3).length,
                ])}
            />
        </PageState>
    );
}
