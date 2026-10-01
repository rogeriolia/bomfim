import { useState } from "react";
import { useApp } from "@/app/store";
import { Button, PageState, Status } from "@/components/bomfim/ui";
import { integrations } from "@/data/mocks/registrations";

export default function IntegracoesPage() {
    const { notify } = useApp();
    const [last, setLast] = useState<Record<string, string>>({});
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Integrações</h2>
                    <p>Serviços preparados para a próxima etapa do produto.</p>
                </div>
            </div>
            <div className="two-grid">
                {integrations.map((s) => (
                    <section className="panel" key={s}>
                        <div className="section-heading">
                            <h2>{s}</h2>
                            <Status>Ativa</Status>
                        </div>
                        <p className="subtle">Última sincronização: {last[s] || "Hoje, 09:42"}</p>
                        <p className="subtle">Conexão simulada · Pack 01</p>
                        <Button
                            size="sm"
                            color="secondary"
                            onClick={() => {
                                setLast((v) => ({ ...v, [s]: "Agora" }));
                                notify(`Teste de ${s} concluído em modo demonstrativo.`);
                            }}
                        >
                            Testar conexão
                        </Button>
                    </section>
                ))}
            </div>
        </PageState>
    );
}
