import type { Registration } from "@/data/mocks/registrations";
import type { UserRole } from "@/app/store";

const TOKEN_KEY = "bomfim-token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, remember: boolean) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(path, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError((data as { error?: string }).error || "Erro na requisição", res.status);
    }
    return data as T;
}

export interface ApiUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    unit: string | null;
    status: string;
    last_access_at: string | null;
}

export interface LoginResponse {
    token: string;
    user: ApiUser;
}

export const api = {
    login: (email: string, password: string) =>
        request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    listUsers: () => request<ApiUser[]>("/api/users"),

    createUser: (body: { name: string; email: string; role: string; unit: string }) =>
        request<ApiUser>("/api/users", { method: "POST", body: JSON.stringify(body) }),

    listRegistrations: () => request<Registration[]>("/api/registrations"),

    updateRegistration: (id: string, patch: Partial<Registration>) =>
        request<Registration>(`/api/registrations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    createRegistration: (body: Partial<Registration>) =>
        request<Registration>("/api/registrations", { method: "POST", body: JSON.stringify(body) }),

    listUnits: () =>
        request<{ id: number; name: string; code: string; locality: string; responsible: string; status: string }[]>("/api/units"),

    listIntegrations: () =>
        request<{ id: number; name: string; active: boolean; last_sync_at: string | null }[]>("/api/integrations"),

    listAuditLogs: () =>
        request<{ id: number; occurred_at: string; user: string; event: string; resource: string; result: string }[]>("/api/audit-logs"),

    listEmailTemplates: () =>
        request<{ id: number; name: string; trigger: string; last_reviewed_at: string }[]>("/api/email-templates"),

    listDocuments: () =>
        request<{ id: number; filename: string; company: string; doc_type: string; uploaded_by: string; uploaded_at: string; status: string }[]>(
            "/api/documents",
        ),

    listSignatures: () =>
        request<{ id: number; company: string; document: string; sent_at: string; signatories: string; status: string; last_updated_at: string }[]>(
            "/api/signatures",
        ),

    listSyncEvents: () =>
        request<{ id: number; company: string; operation: string; occurred_at: string; status: string }[]>("/api/sync-events"),

    getSettings: () =>
        request<{ organization_name: string; timezone: string; show_operational_warnings: boolean; show_activity_summary: boolean }>("/api/settings"),
};

export function formatDateTime(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10).split("-").reverse().join("/");
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR");
}
