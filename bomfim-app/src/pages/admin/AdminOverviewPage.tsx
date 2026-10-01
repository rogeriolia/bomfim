import { Button, Metric, PageState } from "@/components/bomfim/ui";

export default function AdminOverviewPage() {
    return (
        <PageState>
            <div className="metrics">
                <Metric label="Usuários" value="4" />
                <Metric label="Perfis de acesso" value="4" />
                <Metric label="Unidades" value="3" />
                <Metric label="Integrações disponíveis" value="4" />
            </div>
            <div className="three-grid">
                {[
                    ["Pessoas e acesso", "Gerencie quem participa da operação.", "/admin/usuarios"],
                    ["Integrações", "Acompanhe os serviços conectados.", "/admin/integracoes"],
                    ["Configurações", "Defina as preferências do ambiente.", "/admin/configuracoes"],
                ].map(([s, d, p]) => (
                    <section key={s} className="panel">
                        <h2>{s}</h2>
                        <p className="subtle">{d}</p>
                        <Button color="link-color" size="sm" href={p}>
                            Gerenciar →
                        </Button>
                    </section>
                ))}
            </div>
        </PageState>
    );
}
