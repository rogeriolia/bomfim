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

export type IntegrationAccessRow = { name: string; ok: boolean; detail?: string };

export type IntegrationAccessStatus = {
    api_ok: boolean;
    checked_at: string;
    integrations: IntegrationAccessRow[];
};

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
        let message = (data as { error?: string }).error || "Erro na requisição";
        if (res.status === 404 && init.method === "PATCH" && path.includes("/api/users/")) {
            message =
                "Não foi possível salvar (API desatualizada). Encerre o processo na porta 5001 e rode python run.py novamente.";
        }
        throw new ApiError(message, res.status);
    }
    return data as T;
}

export type CnaeActivity = { code?: string; text?: string };
export type QsaMember = { nome?: string; qual?: string; qualificacao?: string };

export interface CnpjLookupResult {
    cnpj: string;
    name: string;
    trade_name: string;
    city: string;
    status: string;
    tipo?: string;
    opening_date?: string;
    legal_nature?: string;
    company_size?: string;
    share_capital?: string;
    street?: string;
    street_number?: string;
    complement?: string;
    district?: string;
    zip_code?: string;
    municipality?: string;
    state?: string;
    email?: string;
    phone?: string;
    situation?: string;
    situation_date?: string;
    situation_reason?: string;
    special_situation?: string;
    special_situation_date?: string;
    efr?: string;
    main_activity?: CnaeActivity[];
    secondary_activities?: CnaeActivity[];
    qsa?: QsaMember[];
}

export interface ApiUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    unit: string | null;
    status: string;
    last_access_at: string | null;
    photo: string | null;
}

export interface LoginResponse {
    token: string;
    user: ApiUser;
}

export const api = {
    login: (email: string, password: string) =>
        request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    listUsers: () => request<ApiUser[]>("/api/users"),

    createUser: (body: { name: string; email: string; role: string; unit: string; photo?: string | null }) =>
        request<ApiUser>("/api/users", { method: "POST", body: JSON.stringify(body) }),

    updateUser: (
        id: number,
        body: Partial<{ name: string; email: string; role: string; unit: string; photo: string | null; status: string }>,
    ) => request<ApiUser>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    listRegistrations: () => request<Registration[]>("/api/registrations"),

    updateRegistration: (id: string, patch: Partial<Registration>) =>
        request<Registration>(`/api/registrations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    createRegistration: (body: Partial<Registration>) =>
        request<Registration>("/api/registrations", { method: "POST", body: JSON.stringify(body) }),

    lookupCnpj: (cnpj: string) => {
        const digits = cnpj.replace(/\D/g, "");
        return request<CnpjLookupResult>(`/api/cnpj/${digits}`);
    },

    listUnits: () =>
        request<{ id: number; name: string; code: string; locality: string; responsible: string; status: string }[]>("/api/units"),

    listIntegrations: () =>
        request<{ id: number; name: string; active: boolean; last_sync_at: string | null }[]>("/api/integrations"),

    getIntegrationAccessStatus: (refresh = false) =>
        request<IntegrationAccessStatus>(`/api/integrations/access-status${refresh ? "?refresh=1" : ""}`),

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
