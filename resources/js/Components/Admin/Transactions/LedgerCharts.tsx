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
                <div className="h-52 animate-pulse rounded-2xl bg-slate-50/50 ring-1 ring-slate-100" />
                <div className="h-52 animate-pulse rounded-2xl bg-slate-50/50 ring-1 ring-slate-100" />
            </div>
        );
    }

    if (!data) return null;

    const hasData = data.money_in_vs_out.some((d) => d.money_in > 0 || d.money_out > 0);
    if (!hasData) return null;

    return (
        <div className="grid gap-5 lg:grid-cols-2">
            {/* Chart 1: Revenue Trend */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="mb-4">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Revenue Trend</p>
                    <h3 className="text-base leading-tight font-extrabold text-slate-900">Successful Inbound Payments</h3>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.revenue_trend.map((d) => ({ ...d, label: formatLabel(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis
                            tickFormatter={formatCurrency}
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                        />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                        <Line type="monotone" dataKey="amount" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Chart 2: Money In vs Money Out */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="mb-4">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Cash Flow</p>
                    <h3 className="text-base leading-tight font-extrabold text-slate-900">Credits vs. Debits Volume</h3>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.money_in_vs_out.map((d) => ({ ...d, label: formatLabel(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            interval={6}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                        />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                        <Bar dataKey="money_in" name="Money In" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="money_out" name="Money Out" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
