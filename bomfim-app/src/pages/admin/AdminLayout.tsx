import { Outlet } from "react-router";
import { ContextNavigation, PageHeading } from "@/components/bomfim/ui";

export default function AdminLayout() {
    return (
        <div className="page">
            <PageHeading title="Administração" eyebrow="GESTÃO INTERNA" description="Pessoas, permissões e configurações da sua operação." />
            <ContextNavigation
                items={["Visão geral", "Usuários", "Perfis", "Unidades", "Integrações", "Auditoria", "Configurações"].map((s, i) => [
                    s,
                    "/admin" + ["", "/usuarios", "/perfis", "/unidades", "/integracoes", "/auditoria", "/configuracoes"][i],
                ])}
            />
            <Outlet />
        </div>
    );
}
