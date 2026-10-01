import { useState } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Navigate, useNavigate } from "react-router";
import { type UserRole, roles, useApp } from "@/app/store";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { BomfimLogo } from "@/components/bomfim/BomfimLogo";
import { Button, Choice, Input } from "@/components/bomfim/ui";

export default function LoginPage() {
    const { user, login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState("renata@bomfim.com.br");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("admin");
    const [remember, setRemember] = useState(false);
    if (user) return <Navigate to="/overview" replace />;
    return (
        <div className="login">
            <section className="login-form-panel">
                <BomfimLogo />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        login(email, role, remember);
                        navigate("/overview");
                    }}
                    className="login-form"
                >
                    <span className="eyebrow">PORTAL DA OPERAÇÃO</span>
                    <h1>Bem-vindo à Bomfim</h1>
                    <p>Acesse sua operação e gerencie seus processos em um único ambiente.</p>
                    <Input label="E-mail" type="email" isRequired value={email} onChange={setEmail} />
                    <Input label="Senha" type="password" isRequired value={password} onChange={setPassword} placeholder="Digite uma senha de demonstração" />
                    <Choice
                        label="Perfil de demonstração"
                        value={role}
                        onChange={(v) => setRole(v as UserRole)}
                        items={Object.entries(roles).map(([id, label]) => ({ id, label }))}
                    />
                    <Checkbox label="Lembrar acesso" isSelected={remember} onChange={setRemember} />
                    <Button type="submit" size="lg" iconTrailing={ArrowRight}>
                        Entrar
                    </Button>
                    <small>Acesso demonstrativo. Use qualquer e-mail válido e uma senha não vazia. Não utilize sua senha real.</small>
                </form>
                <small>© 2026 Bomfim. Todos os direitos reservados.</small>
            </section>
            <section className="login-visual">
                <div className="logistics-photo" />
                <div className="login-caption">
                    <span className="eyebrow">CONEXÕES QUE MOVEM</span>
                    <h2>
                        Uma operação conectada.
                        <br />
                        Um caminho mais simples.
                    </h2>
                    <p>Do primeiro contato à próxima entrega, tudo no mesmo lugar.</p>
                    <div className="login-steps">
                        <span>Cadastro</span>
                        <i />
                        <span>Relacionamento</span>
                        <i />
                        <span>Operação</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
