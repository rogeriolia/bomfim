import type { UserRole } from "./store";

export const mainNavLinks: [string, string][] = [
    ["Visão Geral", "/overview"],
    ["Funil de Cadastro", "/cadastro"],
    ["Clientes", "/clientes"],
    ["Assinaturas", "/assinaturas"],
    ["Moskit", "/moskit"],
    ["Documentos", "/documentos"],
    ["Relatórios", "/relatorios"],
    ["Administração", "/admin"],
];

export function canAccessPath(role: UserRole, path: string): boolean {
    if (path.startsWith("/admin")) return role === "admin";
    if (path.startsWith("/relatorios")) return role === "admin" || role === "manager" || role === "operator";
    return true;
}

export function filterMainNav(role: UserRole): [string, string][] {
    return mainNavLinks.filter(([, p]) => canAccessPath(role, p));
}

export function canEditOperationalData(role: UserRole): boolean {
    return role !== "promoter";
}
