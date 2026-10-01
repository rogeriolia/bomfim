import { useApp } from "@/app/store";
import { Button, Metric, PageState } from "@/components/bomfim/ui";

export default function MapaPage() {
    const { records } = useApp();
    return (
        <PageState>
            <div className="section-heading">
                <div>
                    <h2>Mapa da operação</h2>
                    <p>Distribuição de cadastros por unidade</p>
                </div>
            </div>
            <div className="three-grid">
                {["Salvador", "Feira de Santana", "Aracaju"].map((s) => (
                    <section className="panel" key={s}>
                        <div className="unit-map">
                            <span className="map-pin">●</span>
                            <span>{s}</span>
                        </div>
                        <Metric label={s} value={records.filter((r) => r.unit === s).length} />
                        <Button size="sm" color="link-gray" href="/cadastro/lista">
                            Consultar cadastros →
                        </Button>
                    </section>
                ))}
            </div>
        </PageState>
    );
}
