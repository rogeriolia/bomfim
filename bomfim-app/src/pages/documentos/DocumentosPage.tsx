import { useState } from "react";
import { File06, UploadCloud02 } from "@untitledui/icons";
import { useApp } from "@/app/store";
import { Button, DataTable, PageHeading, PageState, SearchFilter, Status } from "@/components/bomfim/ui";

export default function DocumentosPage() {
    const { records, notify } = useApp();
    const [upload, setUpload] = useState(false);
    const [search, setSearch] = useState("");
    const [files, setFiles] = useState<string[]>([]);
    return (
        <div className="page">
            <PageHeading title="Documentos" eyebrow="ARQUIVOS DA OPERAÇÃO" description="Consulte e organize a documentação das empresas.">
                <Button size="sm" iconLeading={UploadCloud02} onClick={() => setUpload(!upload)}>
                    Enviar documento
                </Button>
            </PageHeading>
            <PageState>
                {upload && (
                    <label className="upload-zone">
                        <UploadCloud02 />
                        <strong>Selecione documentos para esta demonstração</strong>
                        <span>PDF, PNG ou JPG · até 10 MB por arquivo</span>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                                const all = Array.from(e.target.files || []);
                                const accepted = all.filter((f) => f.size <= 10 * 1024 * 1024 && /\.(pdf|png|jpe?g)$/i.test(f.name));
                                setFiles((v) => [...v, ...accepted.map((f) => f.name)]);
                                notify(
                                    accepted.length === all.length
                                        ? "Arquivos adicionados à prévia local."
                                        : "Alguns arquivos foram recusados por tamanho ou formato.",
                                );
                                e.target.value = "";
                            }}
                        />
                    </label>
                )}
                <SearchFilter search={search} setSearch={setSearch} />
                <DataTable
                    title="Documentos"
                    columns={["Documento", "Empresa", "Tipo", "Enviado por", "Data", "Status"]}
                    rows={[
                        ...files
                            .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
                            .map((s) => [
                                <span className="file-name">
                                    <File06 />
                                    {s}
                                </span>,
                                "Prévia local",
                                s.split(".").pop()?.toUpperCase() || "Arquivo",
                                "Renata Melo",
                                "30/09/2026",
                                <Status>Aguardando validação</Status>,
                            ]),
                        ...records
                            .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
                            .slice(0, 8)
                            .map((r, i) => [
                                <span className="file-name">
                                    <File06 />
                                    {i % 2 ? "Contrato social.pdf" : "Comprovante de endereço.pdf"}
                                </span>,
                                r.name,
                                "PDF",
                                r.owner,
                                r.updated.split("-").reverse().join("/"),
                                <Status>{i % 3 ? "Aprovado" : "Em análise"}</Status>,
                            ]),
                    ]}
                />
            </PageState>
        </div>
    );
}
