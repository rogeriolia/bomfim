import { DataTable, PageState, Status } from "@/components/bomfim/ui";

export default function AuditoriaPage() {
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Auditoria</h2>
                    <p>Exemplos de eventos que serão registrados pelo sistema.</p>
                </div>
            </div>
            <DataTable
                title="Auditoria demonstrativa"
                columns={["Data e hora", "Usuário", "Evento", "Recurso", "Resultado"]}
                rows={[
                    ["30/09/2026 09:42", "Renata Melo", "Atualização cadastral", "Flatter Cosméticos", <Status>Concluído</Status>],
                    ["30/09/2026 09:38", "Mariana Costa", "Validação de documentos", "Tropical Bebidas", <Status>Concluído</Status>],
                    ["30/09/2026 09:30", "Lucas Almeida", "Sincronização simulada", "Moskit", <Status>Concluído</Status>],
                ]}
            />
        </PageState>
    );
}
