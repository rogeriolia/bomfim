import { useState } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Navigate, useNavigate } from "react-router";
import { useApp } from "@/app/store";
import { ApiError } from "@/api/client";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { BomfimLogo } from "@/components/bomfim/BomfimLogo";
import { Button, Input } from "@/components/bomfim/ui";

export default function LoginPage() {
    const { user, login } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) return <Navigate to="/overview" replace />;

    return (
        <div className="login">
            <section className="login-form-panel">
                <BomfimLogo />
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setError("");
                        setLoading(true);
                        try {
                            await login(email, password, remember);
                            navigate("/overview");
                        } catch (err) {
                            setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Verifique a API.");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="login-form"
                >
                    <span className="eyebrow">PORTAL DA OPERAÇÃO</span>
                    <h1>Bem-vindo à Bomfim</h1>
                    <p>Acesse sua operação e gerencie seus processos em um único ambiente.</p>
                    <Input label="E-mail" type="email" isRequired value={email} onChange={setEmail} />
                    <Input label="Senha" type="password" isRequired value={password} onChange={setPassword} placeholder="Digite sua senha" />
                    <Checkbox label="Lembrar acesso" isSelected={remember} onChange={setRemember} />
                    {error && (
                        <p role="alert" className="error-text">
                            {error}
                        </p>
                    )}
                    <Button type="submit" size="lg" iconTrailing={ArrowRight} isLoading={loading} isDisabled={loading}>
                        Entrar
                    </Button>
                    <small>Use o e-mail cadastrado e a senha definida pelo administrador.</small>
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
