import { useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { NavLink } from "react-router";
import type { Registration } from "@/data/mocks/registrations";
import { Input } from "@/components/bomfim/ui";

export function GlobalSearch({ records }: { records: Registration[] }) {
    const [search, setSearch] = useState("");
    const query = search.toLowerCase();
    const matches = records.filter((r) => (r.name + r.cnpj).toLowerCase().includes(query)).slice(0, 5);

    return (
        <div className="global-search">
            <Input
                id="global-search"
                size="sm"
                icon={SearchLg}
                placeholder="Buscar na operação..."
                shortcut="⌘ K"
                value={search}
                onChange={setSearch}
            />
            {search && (
                <div className="search-results">
                    {matches.map((r) => (
                        <NavLink key={r.id} to={"/clientes/" + r.id}>
                            {r.name}
                            <small>{r.cnpj}</small>
                        </NavLink>
                    ))}
                    {!matches.length && <p>Nenhuma empresa encontrada.</p>}
                </div>
            )}
        </div>
    );
}
