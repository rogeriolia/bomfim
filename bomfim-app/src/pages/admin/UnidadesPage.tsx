import { DataTable, PageState, Status } from "@/components/bomfim/ui";

export default function UnidadesPage() {
    return (
        <PageState>
            <div className="section-heading">
                <h2>Unidades da operação</h2>
            </div>
            <DataTable
                title="Unidades"
                columns={["Unidade", "Código", "Localidade", "Responsável", "Status"]}
                rows={[
                    ["Salvador", "SSA", "Salvador, BA", "Renata Melo", <Status>Ativa</Status>],
                    ["Feira de Santana", "FSA", "Feira de Santana, BA", "Mariana Costa", <Status>Ativa</Status>],
                    ["Aracaju", "AJU", "Aracaju, SE", "Lucas Almeida", <Status>Ativa</Status>],
                ]}
            />
        </PageState>
    );
}
