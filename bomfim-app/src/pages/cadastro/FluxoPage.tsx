import { useApp } from "@/app/store";
import { PageState, Status } from "@/components/bomfim/ui";
import { stages } from "@/data/mocks/registrations";

export default function FluxoPage() {
    const { records } = useApp();
    return (
        <PageState>
            <section className="panel">
                <h2>Fluxo do cadastro</h2>
                <p className="subtle">Etapas, critérios de avanço e responsáveis pela operação.</p>
                {stages.map((s, i) => (
                    <div className="timeline-item" key={s}>
                        <span>{i + 1}</span>
                        <div>
                            <h3>{s}</h3>
                            <p>
                                {
                                    [
                                        "Recebimento do CNPJ e identificação da empresa.",
                                        "Validação cadastral, documentos e tabela de preços.",
                                        "Envio do contrato e acompanhamento dos signatários.",
                                        "Cliente aprovado e disponível para operação.",
                                        "Registro do motivo e encerramento da solicitação.",
                                    ][i]
                                }
                            </p>
                        </div>
                        <Status>{`${records.filter((r) => r.stage === i).length} cadastros`}</Status>
                    </div>
                ))}
            </section>
        </PageState>
    );
}
