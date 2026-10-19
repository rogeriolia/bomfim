import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError, listReportsProjeto, type ReportsProjetoItem } from "@/api/client";
import { BomfimLogo } from "@/components/bomfim/BomfimLogo";

export default function ReportsProjetoPage() {
    const [items, setItems] = useState<ReportsProjetoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const data = await listReportsProjeto();
                if (!cancelled) setItems(data.items);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof ApiError ? err.message : "Não foi possível carregar os reports.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="reports-projeto">
            <section className="reports-projeto-panel">
                <BomfimLogo />
                <header className="reports-projeto-header">
                    <span className="eyebrow">ACESSO PÚBLICO</span>
                    <h1>Reports projeto</h1>
                    <p>Documentos HTML publicados para consulta, sem necessidade de login.</p>
                </header>

                {loading && (
                    <p className="reports-projeto-status" role="status">
                        Carregando reports…
                    </p>
                )}
                {error && (
                    <p className="error-text" role="alert">
                        {error}
                    </p>
                )}
                {!loading && !error && items.length === 0 && (
                    <p className="reports-projeto-status">Nenhum report publicado ainda.</p>
                )}
                {!loading && items.length > 0 && (
                    <ol className="reports-projeto-list">
                        {items.map((item) => (
                            <li key={item.filename}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <span className="reports-projeto-list-number">{String(item.number).padStart(2, "0")}</span>
                                    <span>{item.title}</span>
                                </a>
                            </li>
                        ))}
                    </ol>
                )}

                <Link to="/login" className="reports-projeto-back">
                    Voltar ao login
                </Link>
            </section>
        </div>
    );
}
