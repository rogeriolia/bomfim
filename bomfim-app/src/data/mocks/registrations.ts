import { demoCnpjs } from "@/utils/demo-cnpj";

export const stages=['Caixa de entrada','Cadastro em andamento','Aguardando assinatura','Cadastro finalizado','Cadastros declinados'];

export function stageLabel(stage: number | null | undefined): string {
    if (stage == null || stage < 0 || stage >= stages.length) return "—";
    return stages[stage] ?? "—";
}

/** Listagem API envia anexos: [] + anexos_count (priorizar contador explícito). */
export function registrationAnexoTotal(r: Registration): number {
    if (typeof r.anexos_count === "number") return r.anexos_count;
    return r.anexos?.length ?? 0;
}

export function registrationAnexoAvailable(r: Registration): number {
    if (typeof r.anexos_available_count === "number") return r.anexos_available_count;
    return r.anexos?.filter((a) => a.has_local_file).length ?? 0;
}

export interface RegistrationAnexo {
    id: number;
    filename: string;
    download_status: string;
    has_local_file: boolean;
    file_url?: string | null;
}

export interface RegistrationContato {
    tipo: string;
    nome: string;
    email: string;
    telefone1: string;
    telefone2: string;
    email_ocorrencias: string;
}

export interface Registration {
    id: string;
    name: string;
    cnpj: string;
    promoter: string;
    owner: string;
    table: string;
    tipo_cobranca?: string;
    usuario_ssw?: string;
    contact_email?: string;
    postal_code?: string;
    contact_name?: string;
    stage: number | null;
    city: string;
    unit: string;
    updated: string;
    documents: number;
    comments: number;
    anexos?: RegistrationAnexo[];
    anexos_count?: number;
    anexos_available_count?: number;
    contatos?: RegistrationContato[];
}
const names=['Flatter Cosméticos','Avyquímica do Brasil Ltda','Tropical Bebidas','Nevvia Motos','Casali Empreendimentos','GNC Comércio de Veículos','Adiltex Indústria e Comércio','Serra Verde Alimentos','Nordeste Distribuidora','Lumiê Cosméticos','Alvorada Embalagens','Via Norte Autopeças','Solare Equipamentos','Vitta Produtos Naturais','Costa Sul Têxtil','Pontal Comércio de Materiais','Brisa Farma','Araponga Indústria'];

export const initialRegistrations: Registration[] = names.map((name, i) => ({
    id: String(i + 1),
    name,
    cnpj: demoCnpjs[i] ?? demoCnpjs[0],
    promoter: ["Ana Ferreira", "Rafael Martins", "Camila Santos"][i % 3],
    owner: ["Mariana Costa", "Lucas Almeida", "Renata Melo"][i % 3],
    table: ["Capital Express", "Interior Premium", "Regional Standard"][i % 3],
    stage: [0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4][i],
    city: ["Salvador, BA", "Feira de Santana, BA", "Aracaju, SE"][i % 3],
    unit: ["Salvador", "Feira de Santana", "Aracaju"][i % 3],
    updated: `2026-09-${String(30 - (i % 8)).padStart(2, "0")}`,
    documents: (i % 4) + 1,
    comments: i % 3,
}));
export const integrations=['Moskit','Pipefy','Receita Federal','Click Sign','Zapier'];
