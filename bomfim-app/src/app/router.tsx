import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/pages/admin/AdminLayout";
import CadastroLayout from "@/pages/cadastro/CadastroLayout";
import { ProtectedRoute, RequireRole } from "./access";

const Login = lazy(() => import("@/pages/auth/LoginPage"));
const Overview = lazy(() => import("@/pages/overview/OverviewPage"));
const Kanban = lazy(() => import("@/pages/cadastro/KanbanPage"));
const Mapa = lazy(() => import("@/pages/cadastro/MapaPage"));
const Fluxo = lazy(() => import("@/pages/cadastro/FluxoPage"));
const Lista = lazy(() => import("@/pages/cadastro/ListaPage"));
const Formularios = lazy(() => import("@/pages/cadastro/FormulariosPage"));
const Emails = lazy(() => import("@/pages/cadastro/EmailsPage"));
const Paineis = lazy(() => import("@/pages/cadastro/PaineisPage"));
const Clientes = lazy(() => import("@/pages/clientes/ClientesPage"));
const Cliente = lazy(() => import("@/pages/clientes/ClienteDetailPage"));
const Assinaturas = lazy(() => import("@/pages/assinaturas/AssinaturasPage"));
const Moskit = lazy(() => import("@/pages/moskit/MoskitPage"));
const Zapier = lazy(() => import("@/pages/zapier/ZapierPage"));
const Pipefy = lazy(() => import("@/pages/pipefy/PipefyPage"));
const Documentos = lazy(() => import("@/pages/documentos/DocumentosPage"));
const Relatorios = lazy(() => import("@/pages/relatorios/RelatoriosPage"));
const Admin = lazy(() => import("@/pages/admin/AdminOverviewPage"));
const Usuarios = lazy(() => import("@/pages/admin/UsuariosPage"));
const Perfis = lazy(() => import("@/pages/admin/PerfisPage"));
const Unidades = lazy(() => import("@/pages/admin/UnidadesPage"));
const Integracoes = lazy(() => import("@/pages/admin/IntegracoesPage"));
const Auditoria = lazy(() => import("@/pages/admin/AuditoriaPage"));
const Configuracoes = lazy(() => import("@/pages/admin/ConfiguracoesPage"));
const DesignSystem = lazy(() => import("@/pages/design-system/DesignSystemPage"));
export function AppRoutes() {
    return (
        <Suspense
            fallback={
                <div className="page" role="status">
                    Carregando a operação…
                    <div className="skeleton" />
                </div>
            }
        >
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route index element={<Navigate to="/overview" replace />} />
                        <Route path="overview" element={<Overview />} />
                        <Route path="cadastro" element={<CadastroLayout />}>
                            <Route index element={<Navigate to="kanban" replace />} />
                            <Route path="kanban" element={<Kanban />} />
                            <Route path="mapa" element={<Mapa />} />
                            <Route path="fluxo" element={<Fluxo />} />
                            <Route path="lista" element={<Lista />} />
                            <Route path="formularios" element={<Formularios />} />
                            <Route path="emails" element={<Emails />} />
                            <Route path="paineis" element={<Paineis />} />
                        </Route>
                        <Route path="clientes" element={<Clientes />} />
                        <Route path="clientes/:id" element={<Cliente />} />
                        <Route path="clientes/:id/:section" element={<Cliente />} />
                        <Route path="assinaturas" element={<Assinaturas />} />
                        <Route path="moskit" element={<Moskit />} />
                        <Route path="zapier" element={<Zapier />} />
                        <Route path="pipefy" element={<Pipefy />} />
                        <Route path="documentos" element={<Documentos />} />
                        <Route
                            element={
                                <RequireRole
                                    allow={["admin", "manager", "operator"]}
                                    message="Relatórios estão disponíveis para Administrador, Gestor e Operador."
                                />
                            }
                        >
                            <Route path="relatorios" element={<Relatorios />} />
                        </Route>
                        <Route path="design-system" element={<DesignSystem />} />
                        <Route element={<RequireRole allow={["admin"]} />}>
                            <Route path="admin" element={<AdminLayout />}>
                                <Route index element={<Admin />} />
                                <Route path="usuarios" element={<Usuarios />} />
                                <Route path="perfis" element={<Perfis />} />
                                <Route path="unidades" element={<Unidades />} />
                                <Route path="integracoes" element={<Integracoes />} />
                                <Route path="auditoria" element={<Auditoria />} />
                                <Route path="configuracoes" element={<Configuracoes />} />
                            </Route>
                        </Route>
                        <Route
                            path="*"
                            element={
                                <div className="page empty">
                                    <h1>Página não encontrada</h1>
                                    <a href="/overview">Voltar à visão geral</a>
                                </div>
                            }
                        />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
}
