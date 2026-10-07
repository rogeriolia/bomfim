import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { stages } from "@/data/mocks/registrations";

const STAGE_COLORS = ["var(--bomfim-navy-400)", "var(--bomfim-brand-500)", "var(--bomfim-warning-500)", "var(--bomfim-success-500)", "var(--bomfim-navy-300)"];

function shortStageLabel(label: string): string {
    return label.replace(/^Cadastro /, "").replace(/^Cadastros /, "");
}

export function FunnelStagePie({
    records,
    stageIndices,
    compact,
}: {
    records: { stage: number }[];
    stageIndices?: number[];
    compact?: boolean;
}) {
    const indices = stageIndices ?? stages.map((_, i) => i);
    const total = records.length;
    const data = indices
        .map((i) => {
            const n = records.filter((r) => r.stage === i).length;
            const name = stages[i] ?? `Etapa ${i}`;
            return {
                name: shortStageLabel(name),
                fullName: name,
                value: n,
                pct: total ? Math.round((n / total) * 100) : 0,
                fill: STAGE_COLORS[i % STAGE_COLORS.length],
            };
        })
        .filter((d) => d.value > 0 || indices.length <= 4);

    const chartData = data.every((d) => d.value === 0) ? indices.map((i) => ({ name: shortStageLabel(stages[i]), fullName: stages[i], value: 1, pct: 0, fill: STAGE_COLORS[i % STAGE_COLORS.length] })) : data;

    const pieHeight = compact ? 208 : 232;
    const innerRadius = compact ? 40 : 46;
    const outerRadius = compact ? 72 : 82;

    return (
        <div className="funnel-pie-panel">
            <div className="funnel-pie-chart">
                <ResponsiveContainer width="100%" height={pieHeight}>
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} stroke="var(--bomfim-surface)" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={
                                <ChartTooltipContent
                                    isPieChart
                                    formatter={(v) => `${v} cadastros`}
                                    labelFormatter={(_, p) => (p?.[0]?.payload as { fullName?: string })?.fullName ?? ""}
                                />
                            }
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <ul className="funnel-pie-legend" aria-label="Legenda do funil">
                {chartData.map((entry) => (
                    <li key={entry.fullName}>
                        <span className="funnel-pie-swatch" style={{ backgroundColor: entry.fill }} aria-hidden />
                        <span>
                            {entry.name} · {entry.value} ({entry.pct}%)
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
