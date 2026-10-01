import { DataTable, PageState, Status } from "@/components/bomfim/ui";

export default function PerfisPage() {
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Perfis e permissões</h2>
                    <p>Controle inicial de acesso. A proteção definitiva deverá ser validada pelo futuro backend.</p>
                </div>
            </div>
            <DataTable
                title="Perfis"
                columns={["Perfil", "Acesso operacional", "Administração", "Escopo"]}
                rows={[
                    ["Administrador", "Consultar e editar", <Status>Ativo</Status>, "Todas as áreas"],
                    ["Gestor", "Consultar e editar", "Sem acesso", "Módulos operacionais"],
                    ["Operador", "Consultar e editar", "Sem acesso", "Módulos operacionais"],
                    ["Promotor", "Consultar e editar", "Sem acesso", "Módulos operacionais"],
                ]}
            />
        </PageState>
    );
}
