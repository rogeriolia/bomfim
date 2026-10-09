import { PageHeading, PageState } from "@/components/bomfim/ui";

export default function ZapierPage() {
    return (
        <div className="page">
            <PageHeading title="Zapier" eyebrow="INTEGRAÇÕES" description="Automações e fluxos conectados à operação." />
            <PageState>
                <section className="panel">
                    <p className="subtle">
                        O status da conexão aparece na barra superior. Configure as credenciais Zapier no .env do servidor e reinicie a API.
                    </p>
                </section>
            </PageState>
        </div>
    );
}
