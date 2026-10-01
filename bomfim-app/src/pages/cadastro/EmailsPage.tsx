import { type ReactNode, useEffect, useState } from "react";
import { ApiError, api, formatDate } from "@/api/client";
import { useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button, DataTable, PageState } from "@/components/bomfim/ui";

export default function EmailsPage() {
    const { notify } = useApp();
    const [template, setTemplate] = useState("");
    const [rows, setRows] = useState<(string | ReactNode)[][]>([]);

    useEffect(() => {
        void (async () => {
            try {
                const items = await api.listEmailTemplates();
                setRows(
                    items.map((t) => [
                        t.name,
                        t.trigger,
                        formatDate(t.last_reviewed_at),
                        <Button color="link-color" size="sm" onClick={() => setTemplate(t.name)}>
                            Visualizar
                        </Button>,
                    ]),
                );
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar modelos.");
            }
        })();
    }, [notify]);

    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>E-mails da operação</h2>
                    <p>Modelos de comunicação em cada etapa do cadastro</p>
                </div>
            </div>
            <DataTable title="Modelos de e-mail" columns={["Modelo", "Gatilho", "Última revisão", "Ação"]} rows={rows} />
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
                            ? "Seu cadastro foi aprovado. Em breve nossa equipe entrará em contato."
                            : "Este é um modelo de comunicação da operação Bomfim."}
                    </p>
                </SlideoutMenu.Content>
            </SlideoutMenu>
        </PageState>
    );
}
