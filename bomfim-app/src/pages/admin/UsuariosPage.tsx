import { useEffect, useState } from "react";
import { Plus } from "@untitledui/icons";
import { roles, useApp } from "@/app/store";
import { ApiError, api, formatDateTime, type ApiUser } from "@/api/client";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button, Choice, DataTable, Input, PageState, SearchFilter, Status } from "@/components/bomfim/ui";

export default function UsuariosPage() {
    const { notify } = useApp();
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("operator");
    const [unit, setUnit] = useState("Salvador");
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            setUsers(await api.listUsers());
        } catch (e) {
            notify(e instanceof ApiError ? e.message : "Não foi possível carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Usuários</h2>
                    <p>{loading ? "Carregando…" : `${users.length} pessoas na sua operação`}</p>
                </div>
                <Button size="sm" iconLeading={Plus} onClick={() => setOpen(true)}>
                    Novo usuário
                </Button>
            </div>
            <SearchFilter search={search} setSearch={setSearch} />
            <DataTable
                title="Usuários"
                columns={["Nome", "E-mail", "Perfil", "Unidade", "Status", "Último acesso"]}
                rows={users
                    .filter((u) => (u.name + u.email).toLowerCase().includes(search.toLowerCase()))
                    .map((u) => [
                        u.name,
                        u.email,
                        roles[u.role],
                        u.unit ?? "—",
                        <Status>{u.status === "active" ? "Ativo" : u.status}</Status>,
                        formatDateTime(u.last_access_at),
                    ])}
            />
            <SlideoutMenu isOpen={open} onOpenChange={setOpen} isDismissable>
                <SlideoutMenu.Header onClose={() => setOpen(false)}>
                    <h2>Novo usuário</h2>
                    <p className="subtle">Senha inicial padrão: 123456789 (alterável depois).</p>
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    <form
                        className="form-stack"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setError("");
                            try {
                                await api.createUser({ name, email, role, unit });
                                setName("");
                                setEmail("");
                                setOpen(false);
                                notify("Usuário adicionado com sucesso.");
                                await load();
                            } catch (err) {
                                setError(err instanceof ApiError ? err.message : "Erro ao criar usuário.");
                            }
                        }}
                    >
                        <Input label="Nome" isRequired value={name} onChange={setName} />
                        <Input label="E-mail" type="email" isRequired value={email} onChange={setEmail} />
                        <Choice label="Perfil" value={role} onChange={setRole} items={Object.entries(roles).map(([id, label]) => ({ id, label }))} />
                        <Choice
                            label="Unidade"
                            value={unit}
                            onChange={setUnit}
                            items={["Salvador", "Aracaju", "Feira de Santana"].map((x) => ({ id: x, label: x }))}
                        />
                        {error && (
                            <p role="alert" className="error-text">
                                {error}
                            </p>
                        )}
                        <Button type="submit">Adicionar usuário</Button>
                    </form>
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </PageState>
    );
}
