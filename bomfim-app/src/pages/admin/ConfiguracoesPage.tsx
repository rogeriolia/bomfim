import { useState } from "react";
import { useApp } from "@/app/store";
import { Toggle } from "@/components/base/toggle/toggle";
import { Button, Choice, Input, PageState } from "@/components/bomfim/ui";

export default function ConfiguracoesPage() {
    const { notify } = useApp();
    const [name, setName] = useState("Bomfim");
    const [zone, setZone] = useState("America/Sao_Paulo");
    return (
        <PageState>
            <section className="panel">
                <h2>Preferências do ambiente</h2>
                <p className="subtle">Configurações demonstrativas para a operação.</p>
                <form
                    className="form-stack narrow-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        notify("Preferências salvas nesta demonstração.");
                    }}
                >
                    <Input label="Nome da organização" value={name} onChange={setName} isRequired />
                    <Choice
                        label="Fuso horário"
                        value={zone}
                        onChange={setZone}
                        items={[
                            { id: "America/Sao_Paulo", label: "Brasília (UTC−3)" },
                            { id: "America/Manaus", label: "Manaus (UTC−4)" },
                        ]}
                    />
                    <Toggle label="Exibir avisos operacionais" defaultSelected />
                    <Toggle label="Resumo de atividades" defaultSelected />
                    <Button type="submit">Salvar preferências</Button>
                </form>
            </section>
        </PageState>
    );
}
