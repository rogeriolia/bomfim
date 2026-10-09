import { PageHeading, PageState } from "@/components/bomfim/ui";

export default function PipefyPage() {
    return (
        <div className="page">
            <PageHeading title="Pipefy" eyebrow="INTEGRAÇÕES" description="Pipes e fluxos de trabalho conectados à operação." />
            <PageState>
                <section className="panel">
                    <p className="subtle">
                        O status da conexão aparece na barra superior. Configure PYPEFY_USUARIO e PYPEFY_SENHA no .env do servidor e reinicie a API.
                    </p>
                </section>
            </PageState>
        </div>
    );
}
