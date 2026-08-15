import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface FlowPoint {
    date: string;
    money_in: number;
    refunds: number;
    adjustments: number;
    money_out: number;
    net_revenue: number;
}

interface Props {
    data?: FlowPoint[];
    loading?: boolean;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(value / 100);

export default function MoneyFlowChart({ data, loading }: Props) {
    if (loading || !data) {
        return <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />;
    }

    const chartData = data.map((point) => ({
        ...point,
        label: point.date.slice(5),
    }));

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Money Flow</p>
                <p className="mt-1 text-sm text-slate-500">Money in, refunds, adjustments, and net revenue over the last 30 days.</p>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                        />
                        <Bar dataKey="money_in" name="Money In" fill="#1F6FDB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="refunds" name="Refunds" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="adjustments" name="Adjustments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="net_revenue" name="Net Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
