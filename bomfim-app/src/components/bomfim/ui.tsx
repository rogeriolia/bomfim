import { type ReactNode, useState } from "react";
import { AlertCircle, ArrowUpRight, CheckCircle, Download01, FilterLines, SearchLg } from "@untitledui/icons";
import { useLocation, useNavigate } from "react-router";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";

export { Button, Input, Badge };
export function Choice({
    label,
    value,
    onChange,
    items,
}: {
    label: string;
    value: string;
    onChange: (s: string) => void;
    items: { id: string; label: string }[];
}) {
    return (
        <Select aria-label={label} label={label} size="sm" selectedKey={value} onSelectionChange={(key) => onChange(String(key))} items={items}>
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    );
}
export function ContextNavigation({ items }: { items: [string, string][] }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (
        <div className="context-nav">
            <Tabs selectedKey={pathname} onSelectionChange={(key) => navigate(String(key))}>
                <TabList type="underline" aria-label="Navegação contextual">
                    {items.map(([label, path]) => (
                        <Tab key={path} id={path} href={path}>
                            {label}
                        </Tab>
                    ))}
                </TabList>
            </Tabs>
        </div>
    );
}
export function PageHeading({ title, description, children, eyebrow }: { title: string; description?: string; children?: ReactNode; eyebrow?: string }) {
    return (
        <header className="page-heading">
            <div>
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            <div className="actions">{children}</div>
        </header>
    );
}
export function Status({ children }: { children: string }) {
    const good = /concl|final|ativo|sincronizado|ativa|aprovado|ok/i.test(children);
    const bad = /erro|expirado|declinado|cancelado/i.test(children);
    return (
        <Badge size="sm" color={good ? "success" : bad ? "error" : "warning"} type="pill-color">
            {children}
        </Badge>
    );
}
export function Metric({ label, value, change }: { label: string; value: string | number; change?: string }) {
    return (
        <div className="metric">
            <div className="metric-label">
                {label}
                <ArrowUpRight />
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">
                <span>{change || "Base de demonstração"}</span>
                {change && " vs. período anterior"}
            </div>
        </div>
    );
}
export function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: ReactNode[][] }) {
    return (
        <TableCard.Root size="sm">
            <div className="table-scroll">
                <Table aria-label={title}>
                    <Table.Header columns={columns.map((label, i) => ({ id: "column-" + i, label }))}>
                        {(column) => <Table.Head id={column.id} isRowHeader={column.id === "column-0"} label={column.label} />}
                    </Table.Header>
                    <Table.Body renderEmptyState={() => <div className="empty">Nenhum registro encontrado.</div>}>
                        {rows.map((r, i) => (
                            <Table.Row key={i} id={"row-" + i}>
                                {r.map((v, j) => (
                                    <Table.Cell key={j}>{v}</Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        </TableCard.Root>
    );
}
export function exportCsv(name: string, columns: string[], rows: (string | number)[][]) {
    const escape = (v: string | number) =>
        '"' +
        String(v)
            .replace(/^[=+@-]/, "'$&")
            .replaceAll('"', '""') +
        '"';
    const url = URL.createObjectURL(
        new Blob(["\uFEFF" + [columns, ...rows].map((row) => row.map(escape).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.click();
    URL.revokeObjectURL(url);
}
export function ExportButton({ onClick }: { onClick: () => void }) {
    return (
        <Button size="sm" color="secondary" iconLeading={Download01} onClick={onClick}>
            Exportar
        </Button>
    );
}
export function SearchFilter({ search, setSearch, children }: { search: string; setSearch: (v: string) => void; children?: ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="toolbar">
                <Input size="sm" icon={SearchLg} placeholder="Buscar por empresa, CNPJ ou responsável" value={search} onChange={setSearch} />
                <Button size="sm" color="secondary" iconLeading={FilterLines} onClick={() => setOpen(!open)} aria-expanded={open}>
                    Filtros
                </Button>
            </div>
            {open && <div className="filter-panel">{children || <p>Utilize a busca para filtrar os registros exibidos.</p>}</div>}
        </>
    );
}
export function PageState({ children, allowDemoControls }: { children: ReactNode; allowDemoControls?: boolean }) {
    const [state, setState] = useState("success");
    const showPicker = allowDemoControls ?? import.meta.env.DEV;
    return (
        <>
            {showPicker && (
                <details className="state-picker">
                    <summary>Estados da demonstração</summary>
                    <Choice
                        label="Estado da página"
                        value={state}
                        onChange={setState}
                        items={[
                            { id: "success", label: "Sucesso" },
                            { id: "loading", label: "Carregando" },
                            { id: "empty", label: "Vazio" },
                            { id: "error", label: "Erro" },
                        ]}
                    />
                </details>
            )}
            {state === "success" ? (
                children
            ) : state === "loading" ? (
                <div className="panel loading-panel" role="status" aria-label="Carregando">
                    <LoadingIndicator type="line-spinner" size="md" label="Carregando dados da operação..." />
                </div>
            ) : (
                <div className="panel empty">
                    {state === "error" ? <AlertCircle /> : <CheckCircle />}
                    <h2>{state === "error" ? "Não foi possível carregar os dados" : "Nenhum registro por aqui"}</h2>
                    <p>{state === "error" ? "Tente novamente para continuar sua operação." : "Os novos registros serão exibidos nesta área."}</p>
                    <Button color="secondary" size="sm" onClick={() => setState("success")}>
                        {state === "error" ? "Tentar novamente" : "Restaurar demonstração"}
                    </Button>
                </div>
            )}
        </>
    );
}
