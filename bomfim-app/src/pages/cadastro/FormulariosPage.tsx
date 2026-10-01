import { useState } from "react";
import { useApp } from "@/app/store";
import { Button, Choice, Input, PageState } from "@/components/bomfim/ui";

export default function FormulariosPage() {
    const { notify } = useApp();
    const [table, setTable] = useState("capital");
    return (
        <PageState>
            <section className="panel">
                <h2>Formulário de cadastro</h2>
                <p className="subtle">Prévia do formulário utilizado na entrada de novas empresas.</p>
                <form
                    className="form-grid"
                    onSubmit={(e) => {
                        e.preventDefault();
                        notify("Formulário validado. Prévia salva nesta demonstração.");
                    }}
                >
                    <Input label="Razão social" isRequired />
                    <Input label="CNPJ" isRequired placeholder="12.345.678/0001-90" />
                    <Input label="E-mail de contato" type="email" isRequired />
                    <Input label="CEP" placeholder="40.010-000" />
                    <Input label="Nome do responsável" isRequired />
                    <Choice
                        label="Tabela de preços"
                        value={table}
                        onChange={setTable}
                        items={[
                            { id: "capital", label: "Capital Express" },
                            { id: "interior", label: "Interior Premium" },
                        ]}
                    />
                    <Button type="submit">Validar formulário</Button>
                </form>
            </section>
        </PageState>
    );
}
