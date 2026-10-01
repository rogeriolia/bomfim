import { Navigate, Outlet, useLocation } from "react-router";
import { type UserRole, useApp } from "./store";

export function ProtectedRoute() {
    const { user } = useApp();
    const location = useLocation();
    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function RequireRole({
    allow,
    message = "Seu perfil não tem permissão para acessar esta área.",
}: {
    allow: UserRole[];
    message?: string;
}) {
    const { user } = useApp();
    return user && allow.includes(user.role) ? (
        <Outlet />
    ) : (
        <section className="panel empty">
            <h1>Acesso restrito</h1>
            <p>{message}</p>
            <a href="/overview">Voltar à visão geral</a>
        </section>
    );
}
