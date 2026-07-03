import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChartData {
    money_in_vs_out: Array<{ date: string; money_in: number; money_out: number }>;
    daily_volume: Array<{ date: string; count: number; volume: number }>;
    payment_methods: Array<{ method: string; count: number }>;
    transaction_types: Array<{ type: string; count: number }>;
    revenue_trend: Array<{ date: string; amount: number }>;
    refund_trend: Array<{ date: string; amount: number }>;
}

interface Props {
    data?: ChartData | null;
    loading?: boolean;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(value / 100);

const formatLabel = (date: string) => date.slice(5);

export default function LedgerCharts({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-100" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const hasData = data.money_in_vs_out.some((d) => d.money_in > 0 || d.money_out > 0);
    if (!hasData) return null;

    const charts = [
        {
            title: 'Money In vs Money Out',
            subtitle: 'Daily credit and debit volume',
            content: (
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.money_in_vs_out.map((d) => ({ ...d, label: formatLabel(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="money_in" name="Money In" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="money_out" name="Money Out" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Daily Transaction Volume',
            subtitle: 'Number of events per day',
            content: (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.daily_volume.map((d) => ({ ...d, label: formatLabel(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" name="Transactions" stroke="#1F6FDB" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Revenue Trend',
            subtitle: 'Successful incoming payments',
            content: (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.revenue_trend.map((d) => ({ ...d, label: formatLabel(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Line type="monotone" dataKey="amount" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
        {
            title: 'Refund Trend',
            subtitle: 'Outgoing refunds over time',
            content: (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.refund_trend.length ? data.refund_trend.map((d) => ({ ...d, label: formatLabel(d.date) })) : [{ label: '—', amount: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Line type="monotone" dataKey="amount" name="Refunds" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-sm font-bold text-slate-900">Reports</h2>
                <p className="text-xs text-slate-500">Transaction patterns over the last 30 days</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                {charts.map((chart) => (
                    <div key={chart.title} className="rounded-xl border border-slate-200/80 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">{chart.title}</p>
                        <p className="mb-3 text-xs text-slate-400">{chart.subtitle}</p>
                        {chart.content}
                    </div>
                ))}
            </div>
        </div>
    );
}