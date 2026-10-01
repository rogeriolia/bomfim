import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, Grid01, LogOut01, Menu01, Settings01, XClose } from "@untitledui/icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { mainNavLinks } from "@/app/permissions";
import { roles, useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { BomfimLogo } from "@/components/bomfim/BomfimLogo";
import { GlobalSearch } from "@/components/bomfim/GlobalSearch";
import { IntegrationBar } from "@/components/bomfim/IntegrationBar";
import { MainNavigation } from "@/components/bomfim/MainNavigation";
import { Button } from "@/components/bomfim/ui";

export default function AppLayout() {
    const { user, logout, toast, notify, records } = useApp();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [mobile, setMobile] = useState(false);
    const title = pathname.startsWith("/cadastro")
        ? "Funil de Cadastro — DCM"
        : mainNavLinks.find(([, p]) => pathname.startsWith(p))?.[0] || "Design System";

    useEffect(() => {
        setMobile(false);
    }, [pathname]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => notify(""), 5000);
            return () => clearTimeout(t);
        }
    }, [toast, notify]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                document.querySelector<HTMLInputElement>("#global-search")?.focus();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    if (!user) return null;

    return (
        <div className="app-shell">
            <a href="#main" className="skip-link">
                Ir para o conteúdo
            </a>
            <header className="app-header">
                <Button className="mobile-menu" color="tertiary" size="sm" aria-label="Abrir navegação" iconLeading={Menu01} onClick={() => setMobile(true)} />
                <NavLink to="/overview" aria-label="Bomfim início">
                    <BomfimLogo />
                </NavLink>
                <div className="header-divider" />
                <span className="header-context">{title}</span>
                <GlobalSearch records={records} />
                <Dropdown.Root>
                    <Button color="tertiary" size="sm" iconTrailing={ChevronDown}>
                        <span className="user-label">{roles[user.role]}</span>
                        <Avatar size="xs" initials="RM" />
                    </Button>
                    <Dropdown.Popover>
                        <Dropdown.Menu aria-label="Menu do usuário">
                            <Dropdown.Item icon={Settings01} onAction={() => navigate(user.role === "admin" ? "/admin/configuracoes" : "/design-system")}>
                                Configurações
                            </Dropdown.Item>
                            <Dropdown.Item icon={Grid01} onAction={() => navigate("/design-system")}>
                                Design System
                            </Dropdown.Item>
                            <Dropdown.Item icon={LogOut01} onAction={logout}>
                                Sair
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </header>
            <div className="navigation-row">
                <nav className="main-nav" aria-label="Navegação principal">
                    <MainNavigation role={user.role} />
                </nav>
                <div className="environment">
                    <span /> Ambiente de demonstração
                </div>
            </div>
            <IntegrationBar />
            <main id="main">
                <Outlet />
            </main>
            <footer className="app-footer">
                <span>Bomfim · Gestão da operação</span>
                <span>
                    Pack 01 <span className="footer-dot">•</span> Dados demonstrativos
                </span>
            </footer>
            <SlideoutMenu isOpen={mobile} onOpenChange={setMobile} isDismissable>
                <SlideoutMenu.Header onClose={() => setMobile(false)}>
                    <BomfimLogo />
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    <nav className="mobile-nav">
                        <MainNavigation role={user.role} />
                        <NavLink to="/design-system">Design System</NavLink>
                    </nav>
                </SlideoutMenu.Content>
            </SlideoutMenu>
            {toast && (
                <div role="status" className="toast">
                    <CheckCircle />
                    {toast}
                    <button aria-label="Fechar notificação" onClick={() => notify("")}>
                        <XClose />
                    </button>
                </div>
            )}
        </div>
    );
}
