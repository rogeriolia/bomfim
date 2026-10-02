import { demoCnpjs } from "@/utils/demo-cnpj";

export const stages=['Caixa de entrada','Cadastro em andamento','Aguardando assinatura','Cadastro finalizado','Cadastros declinados'];
export interface Registration {id:string;name:string;cnpj:string;promoter:string;owner:string;table:string;stage:number;city:string;unit:string;updated:string;documents:number;comments:number;}
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
export const integrations=['Moskit','Receita Federal','Assinatura Digital','Documentos'];
