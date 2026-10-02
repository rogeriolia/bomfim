import { useEffect, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { ApiError, api, type CnpjLookupResult } from "@/api/client";
import { Button, Input } from "@/components/bomfim/ui";
import { maskCnpjInput, normalizeCnpjForSave, validateCnpj } from "@/utils/cnpj";

type CnpjFieldProps = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    onLookup?: (data: CnpjLookupResult) => void;
    isRequired?: boolean;
};

export function CnpjField({ label = "CNPJ", value, onChange, onLookup, isRequired }: CnpjFieldProps) {
    const [hint, setHint] = useState("");
    const [invalid, setInvalid] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!value) {
            setHint("");
            setInvalid(false);
            setLoading(false);
        }
    }, [value]);

    const runLookup = async () => {
        const normalized = normalizeCnpjForSave(value);
        if (normalized !== value) onChange(normalized);
        const err = validateCnpj(normalized);
        if (err) {
            setInvalid(true);
            setHint(err);
            return;
        }
        setLoading(true);
        setHint("");
        setInvalid(false);
        try {
            const data = await api.lookupCnpj(normalized);
            onChange(data.cnpj);
            onLookup?.(data);
            if (data.status) {
                setHint(`Receita Federal: ${data.status}${data.trade_name ? ` · ${data.trade_name}` : ""}`);
            }
        } catch (e) {
            setInvalid(true);
            setHint(e instanceof ApiError ? e.message : "Não foi possível consultar a Receita Federal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Input
                label={label}
                isRequired={isRequired}
                value={value}
                onChange={(v) => {
                    onChange(maskCnpjInput(v));
                    setInvalid(false);
                    setHint("");
                }}
                onBlur={() => {
                    const normalized = normalizeCnpjForSave(value);
                    if (normalized !== value) {
                        onChange(normalized);
                        setHint("CNPJ da demonstração atualizado para o formato válido.");
                    }
                }}
                isInvalid={invalid}
                hint={hint || undefined}
                placeholder="11.444.777/0001-61"
                inputMode="numeric"
            />
            <Button type="button" size="sm" color="secondary" iconLeading={SearchLg} isLoading={loading} onClick={() => void runLookup()}>
                Consultar Receita Federal
            </Button>
        </div>
    );
}
