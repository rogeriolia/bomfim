import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ApiError, openRegistrationAnexoFile } from "@/api/client";
import { Button, DataTable, Status } from "@/components/bomfim/ui";
import type { RegistrationAnexo } from "@/data/mocks/registrations";

/** Contagem para listagens: total e quantos estão no servidor (Abrir). */
export function RegistrationAnexoCount({
    registrationId,
    anexos,
    anexosCount,
    anexosAvailableCount,
}: {
    registrationId: string;
    anexos?: RegistrationAnexo[];
    anexosCount?: number;
    anexosAvailableCount?: number;
}) {
    const total = anexos?.length ? anexos.length : (anexosCount ?? 0);
    if (!total) {
        return <span className="subtle">0</span>;
    }
    const available = anexos?.length
        ? anexos.filter((a) => a.has_local_file).length
        : (anexosAvailableCount ?? 0);
    const label = available === total ? String(total) : `${available}/${total}`;
    const title =
        available === total
            ? `${total} anexo(s) no servidor`
            : `${available} de ${total} anexo(s) disponível(is) no servidor`;

    return (
        <Link to={`/clientes/${registrationId}/documentos`} className="text-link" title={title}>
            {label}
        </Link>
    );
}

function statusLabel(anexo: RegistrationAnexo): ReactNode {
    if (anexo.download_status === "ok" && anexo.has_local_file) {
        return <Status>Disponível</Status>;
    }
    if (anexo.download_status === "failed") {
        return <Status>Download falhou</Status>;
    }
    if (anexo.download_status === "pending") {
        return <Status>Pendente</Status>;
    }
    return <Status>{anexo.download_status || "—"}</Status>;
}

function AnexoOpenButton({
    registrationId,
    anexo,
    onError,
}: {
    registrationId: string;
    anexo: RegistrationAnexo;
    onError: (msg: string) => void;
}) {
    const [loading, setLoading] = useState(false);
    const canOpen = anexo.has_local_file && anexo.file_url;

    if (!canOpen) {
        return <span className="subtle">—</span>;
    }

    return (
        <Button
            color="link-color"
            size="sm"
            isDisabled={loading}
            isLoading={loading}
            onClick={() => {
                setLoading(true);
                void openRegistrationAnexoFile(registrationId, anexo.id)
                    .catch((e) => {
                        onError(e instanceof ApiError ? e.message : "Erro ao abrir arquivo.");
                    })
                    .finally(() => setLoading(false));
            }}
        >
            Abrir
        </Button>
    );
}

export function RegistrationAnexosList({
    registrationId,
    anexos,
    title = "Anexos do cadastro",
    compact = false,
}: {
    registrationId: string;
    anexos: RegistrationAnexo[];
    title?: string;
    compact?: boolean;
}) {
    const [error, setError] = useState("");

    if (!anexos.length) {
        return (
            <section className="panel">
                <h2>{title}</h2>
                <p className="subtle">Nenhum anexo importado para este cadastro.</p>
            </section>
        );
    }

    const pending = anexos.filter((a) => a.download_status === "pending").length;
    const failed = anexos.filter((a) => a.download_status === "failed").length;
    const list = compact ? anexos.slice(0, 5) : anexos;

    const rows = list.map((a) => [
        a.filename || `Anexo ${a.id}`,
        statusLabel(a),
        <AnexoOpenButton key={a.id} registrationId={registrationId} anexo={a} onError={setError} />,
    ]);

    return (
        <section className="panel">
            {!compact && (
                <>
                    <h2>{title}</h2>
                    {(pending > 0 || failed > 0) && (
                        <p className="subtle">
                            {pending > 0 && `${pending} pendente(s) de download no servidor. `}
                            {failed > 0 && `${failed} com falha no download.`}
                        </p>
                    )}
                </>
            )}
            {error && (
                <p role="alert" className="error-text">
                    {error}
                </p>
            )}
            <DataTable title={title} columns={["Arquivo", "Status", "Ação"]} rows={rows} />
            {compact && anexos.length > 5 && (
                <p className="subtle">+ {anexos.length - 5} anexo(s). Ver todos na aba Documentos.</p>
            )}
        </section>
    );
}
