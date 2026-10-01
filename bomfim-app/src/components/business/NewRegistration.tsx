import { useState } from "react";
import { useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button, Input } from "@/components/bomfim/ui";

export function NewRegistration({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { add, notify } = useApp();
    const [name, setName] = useState("");
    const [cnpj, setCnpj] = useState("");
    return (
        <SlideoutMenu
            isOpen={open}
            onOpenChange={(v) => {
                if (!v) onClose();
            }}
            isDismissable
        >
            <SlideoutMenu.Header onClose={onClose}>
                <h2>Novo cadastro</h2>
                <p className="subtle">Comece pela identificação da empresa.</p>
            </SlideoutMenu.Header>
            <SlideoutMenu.Content>
                <form
                    className="form-stack"
                    onSubmit={(e) => {
                        e.preventDefault();
                        add({
                            id: crypto.randomUUID().slice(0, 8),
                            name,
                            cnpj,
                            stage: 0,
                            promoter: "Ana Ferreira",
                            owner: "Renata Melo",
                            city: "Salvador, BA",
                            unit: "Salvador",
                            table: "Capital Express",
                            updated: "2026-09-30",
                            documents: 0,
                            comments: 0,
                        });
                        notify("Cadastro criado na caixa de entrada.");
                        setName("");
                        setCnpj("");
                        onClose();
                    }}
                >
                    <Input label="Razão social" isRequired value={name} onChange={setName} />
                    <Input
                        label="CNPJ"
                        isRequired
                        value={cnpj}
                        onChange={setCnpj}
                        pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}"
                        placeholder="12.345.678/0001-90"
                    />
                    <p className="subtle">Os dados desta demonstração são mantidos apenas durante a sessão da página.</p>
                    <Button type="submit">Criar cadastro</Button>
                </form>
            </SlideoutMenu.Content>
        </SlideoutMenu>
    );
}
