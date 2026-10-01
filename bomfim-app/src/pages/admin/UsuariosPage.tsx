import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { roles, useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button, Choice, DataTable, Input, PageState, SearchFilter, Status } from "@/components/bomfim/ui";

export default function UsuariosPage() {
    const { notify } = useApp();
    const [users, setUsers] = useState([
        { name: "Renata Melo", email: "renata@bomfim.com.br", role: "admin", unit: "Salvador" },
        { name: "Mariana Costa", email: "mariana@bomfim.com.br", role: "manager", unit: "Salvador" },
        { name: "Lucas Almeida", email: "lucas@bomfim.com.br", role: "operator", unit: "Aracaju" },
        { name: "Ana Ferreira", email: "ana@bomfim.com.br", role: "promoter", unit: "Feira de Santana" },
    ]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("operator");
    const [unit, setUnit] = useState("Salvador");
    const [error, setError] = useState("");
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Usuários</h2>
                    <p>{users.length} pessoas na sua operação</p>
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
                    .map((u) => [u.name, u.email, roles[u.role as keyof typeof roles], u.unit, <Status>Ativo</Status>, "30/09/2026"])}
            />
            <SlideoutMenu isOpen={open} onOpenChange={setOpen} isDismissable>
                <SlideoutMenu.Header onClose={() => setOpen(false)}>
                    <h2>Novo usuário</h2>
                    <p className="subtle">Adicione uma pessoa ao ambiente demonstrativo.</p>
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    <form
                        className="form-stack"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
                                setError("Este e-mail já está cadastrado.");
                                return;
                            }
                            setUsers((v) => [...v, { name, email, role, unit }]);
                            setName("");
                            setEmail("");
                            setError("");
                            setOpen(false);
                            notify("Usuário adicionado nesta demonstração. Nenhum convite foi enviado.");
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
