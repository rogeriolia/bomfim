import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { useApp } from "@/app/store";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { CnpjField } from "@/components/bomfim/cnpj-field";
import { Button, Input } from "@/components/bomfim/ui";
import { cnpjForSubmit, validateCnpj } from "@/utils/cnpj";

export function NewRegistration({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { add, notify } = useApp();
    const [name, setName] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [city, setCity] = useState("Salvador, BA");
    const [usuarioSsw, setUsuarioSsw] = useState("");
    const [error, setError] = useState("");
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        if (!open) return;
        setName("");
        setCnpj("");
        setCity("Salvador, BA");
        setUsuarioSsw("");
        setError("");
        setFormKey((k) => k + 1);
    }, [open]);

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
                        setError("");
                        const cnpjToSave = cnpjForSubmit(cnpj);
                        const cnpjErr = validateCnpj(cnpjToSave);
                        if (cnpjErr) {
                            setError(cnpjErr);
                            return;
                        }
                        void (async () => {
                            try {
                                await add({
                                    id: crypto.randomUUID().slice(0, 8),
                                    name,
                                    cnpj: cnpjToSave,
                                    stage: 0,
                                    promoter: "Ana Ferreira",
                                    owner: "Usuário Bomfim",
                                    city,
                                    unit: "Salvador",
                                    table: "Capital Express",
                                    usuario_ssw: usuarioSsw.trim() || undefined,
                                    updated: "2026-09-30",
                                    documents: 0,
                                    comments: 0,
                                });
                                notify("Cadastro criado na caixa de entrada.");
                                setName("");
                                setCnpj("");
                                setCity("Salvador, BA");
                                setUsuarioSsw("");
                                onClose();
                            } catch (err) {
                                setError(err instanceof ApiError ? err.message : "Não foi possível criar o cadastro.");
                            }
                        })();
                    }}
                >
                    <Input label="Razão social" isRequired value={name} onChange={setName} />
                    <CnpjField
                        key={formKey}
                        isRequired
                        value={cnpj}
                        onChange={setCnpj}
                        onLookup={(data) => {
                            if (data.name) setName(data.name);
                            if (data.city) setCity(data.city);
                        }}
                    />
                    <Input label="Usuário SSW" value={usuarioSsw} onChange={setUsuarioSsw} placeholder="Opcional" />
                    {error && (
                        <p role="alert" className="error-text">
                            {error}
                        </p>
                    )}
                    <Button type="submit">Criar cadastro</Button>
                </form>
            </SlideoutMenu.Content>
        </SlideoutMenu>
    );
}
