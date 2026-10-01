import { type ReactNode, useEffect, useState } from "react";
import { File06, UploadCloud02 } from "@untitledui/icons";
import { ApiError, api, formatDate } from "@/api/client";
import { useApp } from "@/app/store";
import { Button, DataTable, PageHeading, PageState, SearchFilter, Status } from "@/components/bomfim/ui";

export default function DocumentosPage() {
    const { notify } = useApp();
    const [upload, setUpload] = useState(false);
    const [search, setSearch] = useState("");
    const [files, setFiles] = useState<string[]>([]);
    const [apiRows, setApiRows] = useState<(string | ReactNode)[][]>([]);

    useEffect(() => {
        void (async () => {
            try {
                const docs = await api.listDocuments();
                setApiRows(
                    docs.map((d) => [
                        <span className="file-name" key={d.id}>
                            <File06 />
                            {d.filename}
                        </span>,
                        d.company || "—",
                        d.doc_type,
                        d.uploaded_by,
                        formatDate(d.uploaded_at),
                        <Status>{d.status}</Status>,
                    ]),
                );
            } catch (e) {
                notify(e instanceof ApiError ? e.message : "Erro ao carregar documentos.");
            }
        })();
    }, [notify]);

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
                        <strong>Selecione documentos (prévia local)</strong>
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
                                <span className="file-name" key={s}>
                                    <File06 />
                                    {s}
                                </span>,
                                "Prévia local",
                                s.split(".").pop()?.toUpperCase() || "Arquivo",
                                "Renata Melo",
                                formatDate(new Date().toISOString()),
                                <Status>Aguardando validação</Status>,
                            ]),
                        ...apiRows.filter((row) => String(row[1]).toLowerCase().includes(search.toLowerCase()) || String(row[0]).toLowerCase().includes(search.toLowerCase())),
                    ]}
                />
            </PageState>
        </div>
    );
}
