import type { CnaeActivity, CnpjLookupResult, QsaMember } from "@/api/client";

export function displayValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "—";
}

export function formatActivities(items: CnaeActivity[] | undefined): string {
    if (!items?.length) return "—";
    return items
        .map((a) => {
            const code = (a.code || "").trim();
            const text = (a.text || "").trim();
            return code && text ? `${code} — ${text}` : code || text || "";
        })
        .filter(Boolean)
        .join("; ");
}

export function formatQsa(items: QsaMember[] | undefined): string {
    if (!items?.length) return "—";
    return items
        .map((m) => {
            const name = (m.nome || "").trim();
            const role = (m.qual || m.qualificacao || "").trim();
            return role ? `${name} (${role})` : name;
        })
        .filter(Boolean)
        .join("; ");
}

export type FieldRow = [label: string, value: string];

export function bomfimSection(record: {
    id: string;
    name: string;
    stage: number;
    unit: string;
    promoter: string;
    owner: string;
    table: string;
    usuario_ssw?: string;
    contact_email?: string;
    contact_name?: string;
    postal_code?: string;
    city: string;
    updated: string;
    documents: number;
    comments: number;
}, stageLabel: string): FieldRow[] {
    return [
        ["Código", `CAD-${record.id.padStart(4, "0")}`],
        ["Razão social", record.name],
        ["Etapa", stageLabel],
        ["Unidade", record.unit],
        ["Promotor", record.promoter],
        ["Responsável", record.owner],
        ["Tabela de preços", record.table],
        ["Usuário SSW", record.usuario_ssw || "—"],
        ["E-mail de contato", record.contact_email || "—"],
        ["Nome do contato", record.contact_name || "—"],
        ["Localidade (cadastro)", record.city],
        ["CEP (cadastro)", record.postal_code || "—"],
        ["Documentos", String(record.documents)],
        ["Comentários", String(record.comments)],
        ["Última atualização", record.updated.split("-").reverse().join("/")],
    ];
}

export function receitaIdentification(r: CnpjLookupResult): FieldRow[] {
    return [
        ["Razão social", displayValue(r.name)],
        ["Nome fantasia", displayValue(r.trade_name)],
        ["CNPJ", displayValue(r.cnpj)],
        ["Tipo", displayValue(r.tipo)],
        ["Natureza jurídica", displayValue(r.legal_nature)],
        ["Porte", displayValue(r.company_size)],
        ["Capital social", displayValue(r.share_capital)],
        ["Data de abertura", displayValue(r.opening_date)],
        ["EFR", displayValue(r.efr)],
    ];
}

export function receitaAddress(r: CnpjLookupResult | null, fallbackEmail?: string, fallbackPostal?: string): FieldRow[] {
    if (!r) {
        return [
            ["CEP", fallbackPostal || "—"],
            ["E-mail", fallbackEmail || "—"],
        ];
    }
    return [
        ["CEP", displayValue(r.zip_code) !== "—" ? displayValue(r.zip_code) : fallbackPostal || "—"],
        ["Logradouro", displayValue(r.street)],
        ["Número", displayValue(r.street_number)],
        ["Complemento", displayValue(r.complement)],
        ["Bairro", displayValue(r.district)],
        ["Município", displayValue(r.municipality)],
        ["UF", displayValue(r.state)],
        ["E-mail", displayValue(r.email) !== "—" ? displayValue(r.email) : fallbackEmail || "—"],
        ["Telefone", displayValue(r.phone)],
    ];
}

export function receitaSituation(r: CnpjLookupResult | null): FieldRow[] {
    if (!r) return [];
    return [
        ["Situação", displayValue(r.situation || r.status)],
        ["Data da situação", displayValue(r.situation_date)],
        ["Motivo", displayValue(r.situation_reason)],
        ["Situação especial", displayValue(r.special_situation)],
        ["Data situação especial", displayValue(r.special_situation_date)],
    ];
}

export function receitaActivities(r: CnpjLookupResult | null): FieldRow[] {
    if (!r) return [];
    return [
        ["CNAE principal", formatActivities(r.main_activity)],
        ["CNAEs secundários", formatActivities(r.secondary_activities)],
    ];
}

export function receitaQsa(r: CnpjLookupResult | null): FieldRow[] {
    if (!r) return [];
    return [["Quadro societário (QSA)", formatQsa(r.qsa)]];
}
