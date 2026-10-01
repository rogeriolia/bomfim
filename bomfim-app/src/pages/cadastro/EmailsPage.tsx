import { useState } from "react";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button, DataTable, PageState } from "@/components/bomfim/ui";

export default function EmailsPage() {
    const [template, setTemplate] = useState("");
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>E-mails da operação</h2>
                    <p>Modelos de comunicação em cada etapa do cadastro</p>
                </div>
            </div>
            <DataTable
                title="Modelos de e-mail"
                columns={["Modelo", "Gatilho", "Última revisão", "Ação"]}
                rows={["Boas-vindas à Bomfim", "Documentação pendente", "Lembrete de assinatura", "Cadastro aprovado"].map((s, i) => [
                    s,
                    ["Entrada no funil", "Pendência de documentos", "48 horas após envio", "Cadastro finalizado"][i],
                    "29/09/2026",
                    <Button color="link-color" size="sm" onClick={() => setTemplate(s)}>
                        Visualizar
                    </Button>,
                ])}
            />
            <SlideoutMenu
                isOpen={!!template}
                onOpenChange={(v) => {
                    if (!v) setTemplate("");
                }}
                isDismissable
            >
                <SlideoutMenu.Header onClose={() => setTemplate("")}>
                    <h2>{template}</h2>
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    <p>Olá, responsável pelo cadastro!</p>
                    <p>
                        {template === "Cadastro aprovado"
                            ? "Seu cadastro foi aprovado. Estamos prontos para iniciar nossa parceria."
                            : template === "Documentação pendente"
                              ? "Precisamos de documentos complementares para concluir a análise da sua empresa."
                              : template === "Lembrete de assinatura"
                                ? "Seu contrato está disponível para assinatura. Confira os dados antes de concluir."
                                : "Recebemos seu cadastro. Nossa equipe acompanhará as próximas etapas com você."}
                    </p>
                    <p>Conte com a equipe Bomfim.</p>
                    <small>Prévia demonstrativa. Nenhum e-mail será enviado.</small>
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </PageState>
    );
}
