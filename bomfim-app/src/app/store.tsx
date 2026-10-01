import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, api, clearToken, getToken, setToken } from "@/api/client";
import { type Registration, initialRegistrations } from "@/data/mocks/registrations";

export type UserRole = "admin" | "manager" | "operator" | "promoter";
export const roles: Record<UserRole, string> = { admin: "Administrador", manager: "Gestor", operator: "Operador", promoter: "Promotor" };

interface Session {
    name: string;
    email: string;
    role: UserRole;
}

function readSession(): Session | null {
    try {
        const raw = localStorage.getItem("bomfim-session") ?? sessionStorage.getItem("bomfim-session");
        const s = raw ? JSON.parse(raw) : null;
        return s && s.role in roles && getToken() ? s : null;
    } catch {
        return null;
    }
}

function persistSession(session: Session, remember: boolean) {
    localStorage.removeItem("bomfim-session");
    sessionStorage.removeItem("bomfim-session");
    (remember ? localStorage : sessionStorage).setItem("bomfim-session", JSON.stringify(session));
}

function useStore() {
    const [user, setUser] = useState<Session | null>(readSession);
    const [records, setRecords] = useState<Registration[]>(initialRegistrations);
    const [recordsLoaded, setRecordsLoaded] = useState(false);
    const [toast, setToast] = useState("");

    const refreshRecords = useCallback(async () => {
        if (!getToken()) return;
        try {
            const rows = await api.listRegistrations();
            setRecords(rows);
            setRecordsLoaded(true);
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                clearToken();
                setUser(null);
            }
        }
    }, []);

    useEffect(() => {
        if (user) void refreshRecords();
    }, [user, refreshRecords]);

    return {
        user,
        records,
        recordsLoaded,
        toast,
        notify: setToast,
        refreshRecords,
        login: async (email: string, password: string, remember: boolean) => {
            const res = await api.login(email, password);
            setToken(res.token, remember);
            const session = { name: res.user.name, email: res.user.email, role: res.user.role };
            persistSession(session, remember);
            setUser(session);
            await refreshRecords();
        },
        logout: () => {
            clearToken();
            localStorage.removeItem("bomfim-session");
            sessionStorage.removeItem("bomfim-session");
            setUser(null);
            setRecords(initialRegistrations);
            setRecordsLoaded(false);
        },
        update: async (id: string, patch: Partial<Registration>) => {
            const updated = await api.updateRegistration(id, patch);
            setRecords((r) => r.map((x) => (x.id === id ? updated : x)));
            return updated;
        },
        add: async (r: Registration) => {
            const created = await api.createRegistration(r);
            setRecords((v) => [created, ...v]);
            return created;
        },
    };
}

const Store = createContext<ReturnType<typeof useStore> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    return <Store.Provider value={useStore()}>{children}</Store.Provider>;
}

export function useApp() {
    return useContext(Store)!;
}
