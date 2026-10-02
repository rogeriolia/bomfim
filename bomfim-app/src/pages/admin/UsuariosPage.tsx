import { useEffect, useState } from "react";
import { Edit01, Plus } from "@untitledui/icons";
import { roles, useApp } from "@/app/store";
import { ApiError, api, formatDateTime, type ApiUser } from "@/api/client";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Avatar } from "@/components/base/avatar/avatar";
import { getInitialsFromWords } from "@/components/base/avatar/utils";
import { UserPhotoField } from "@/components/bomfim/user-photo-field";
import { Badge, Button, Choice, DataTable, Input, PageState, SearchFilter } from "@/components/bomfim/ui";

const UNITS = ["Salvador", "Aracaju", "Feira de Santana"];
const USER_STATUS_ITEMS = [
    { id: "active", label: "Ativo" },
    { id: "inactive", label: "Inativo" },
];

function userStatusLabel(status: string) {
    return status === "active" ? "Ativo" : status === "inactive" ? "Inativo" : status;
}

function emptyForm() {
    return { name: "", email: "", role: "operator", unit: "Salvador", photo: null as string | null, status: "active" as string };
}

export default function UsuariosPage() {
    const { notify } = useApp();
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ApiUser | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");
    const [photoError, setPhotoError] = useState("");

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

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setError("");
        setPhotoError("");
        setOpen(true);
    };

    const openEdit = (user: ApiUser) => {
        setEditing(user);
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            unit: user.unit ?? "Salvador",
            photo: user.photo,
            status: user.status === "inactive" ? "inactive" : "active",
        });
        setError("");
        setPhotoError("");
        setOpen(true);
    };

    const closeDrawer = () => {
        setOpen(false);
        setEditing(null);
    };

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Usuários</h2>
                    <p>{loading ? "Carregando…" : `${users.length} pessoas na sua operação`}</p>
                </div>
                <Button size="sm" iconLeading={Plus} onClick={openCreate}>
                    Novo usuário
                </Button>
            </div>
            <SearchFilter search={search} setSearch={setSearch} />
            <DataTable
                title="Usuários"
                columns={["Nome", "E-mail", "Perfil", "Unidade", "Status", "Último acesso", ""]}
                rows={users
                    .filter((u) => (u.name + u.email).toLowerCase().includes(search.toLowerCase()))
                    .map((u) => [
                        <div key="name" className="flex min-w-0 items-center gap-2">
                            <Avatar size="xs" src={u.photo} initials={getInitialsFromWords(u.name)} alt={u.name} />
                            <span className="truncate font-medium text-primary">{u.name}</span>
                        </div>,
                        u.email,
                        roles[u.role],
                        u.unit ?? "—",
                        <Badge key="status" size="sm" color={u.status === "active" ? "success" : "gray"} type="pill-color">
                            {userStatusLabel(u.status)}
                        </Badge>,
                        formatDateTime(u.last_access_at),
                        <Button key="edit" size="sm" color="link-gray" iconLeading={Edit01} onClick={() => openEdit(u)}>
                            Editar
                        </Button>,
                    ])}
            />
            <SlideoutMenu isOpen={open} onOpenChange={(isOpen) => !isOpen && closeDrawer()} isDismissable>
                <SlideoutMenu.Header onClose={closeDrawer}>
                    <h2>{editing ? "Editar usuário" : "Novo usuário"}</h2>
                    {!editing && <p className="subtle">Senha inicial padrão: 123456789 (alterável depois).</p>}
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    <form
                        className="form-stack"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setError("");
                            try {
                                const body = {
                                    name: form.name,
                                    email: form.email,
                                    role: form.role,
                                    unit: form.unit,
                                    photo: form.photo,
                                };
                                if (editing) {
                                    await api.updateUser(editing.id, { ...body, status: form.status });
                                    notify("Usuário atualizado.");
                                } else {
                                    await api.createUser(body);
                                    notify("Usuário adicionado com sucesso.");
                                }
                                closeDrawer();
                                setForm(emptyForm());
                                await load();
                            } catch (err) {
                                setError(err instanceof ApiError ? err.message : editing ? "Erro ao atualizar usuário." : "Erro ao criar usuário.");
                            }
                        }}
                    >
                        <UserPhotoField
                            name={form.name}
                            photo={form.photo}
                            onPhotoChange={(photo) => {
                                setPhotoError("");
                                setForm((f) => ({ ...f, photo }));
                            }}
                            onError={setPhotoError}
                        />
                        {photoError && (
                            <p role="alert" className="error-text">
                                {photoError}
                            </p>
                        )}
                        <Input label="Nome" isRequired value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
                        <Input label="E-mail" type="email" isRequired value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} />
                        <Choice
                            label="Perfil"
                            value={form.role}
                            onChange={(role) => setForm((f) => ({ ...f, role }))}
                            items={Object.entries(roles).map(([id, label]) => ({ id, label }))}
                        />
                        <Choice
                            label="Unidade"
                            value={form.unit}
                            onChange={(unit) => setForm((f) => ({ ...f, unit }))}
                            items={UNITS.map((x) => ({ id: x, label: x }))}
                        />
                        {editing && (
                            <Choice
                                label="Status"
                                value={form.status}
                                onChange={(status) => setForm((f) => ({ ...f, status }))}
                                items={USER_STATUS_ITEMS}
                            />
                        )}
                        {error && (
                            <p role="alert" className="error-text">
                                {error}
                            </p>
                        )}
                        <Button type="submit">{editing ? "Salvar alterações" : "Adicionar usuário"}</Button>
                    </form>
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </PageState>
    );
}
