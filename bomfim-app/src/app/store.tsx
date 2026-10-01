import { type ReactNode, createContext, useContext, useState } from "react";
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
        return s && s.role in roles ? s : null;
    } catch {
        return null;
    }
}
function useStore() {
    const [user, setUser] = useState<Session | null>(readSession);
    const [records, setRecords] = useState(initialRegistrations);
    const [toast, setToast] = useState("");
    return {
        user,
        records,
        toast,
        notify: setToast,
        login: (email: string, role: UserRole, remember: boolean) => {
            const s = { name: "Renata Melo", email, role };
            localStorage.removeItem("bomfim-session");
            sessionStorage.removeItem("bomfim-session");
            (remember ? localStorage : sessionStorage).setItem("bomfim-session", JSON.stringify(s));
            setUser(s);
        },
        logout: () => {
            localStorage.removeItem("bomfim-session");
            sessionStorage.removeItem("bomfim-session");
            setUser(null);
        },
        update: (id: string, patch: Partial<Registration>) => setRecords((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))),
        add: (r: Registration) => setRecords((v) => [r, ...v]),
    };
}
const Store = createContext<ReturnType<typeof useStore> | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
    return <Store.Provider value={useStore()}>{children}</Store.Provider>;
}
export function useApp() {
    return useContext(Store)!;
}
