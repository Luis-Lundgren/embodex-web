"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EarningsDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requestPayoutOpen, setRequestPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutMethod, setPayoutMethod] = useState("mock_bank");
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const fetchEarnings = async () => {
        try {
            const res = await fetch("/api/mock-payments/earnings");
            if (!res.ok) throw new Error("Failed to fetch earnings");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setPayoutLoading(true);
        setError("");

        const amountCents = Math.round(parseFloat(payoutAmount) * 100);

        try {
            const res = await fetch("/api/mock-payments/payouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amountCents, method: payoutMethod })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Payout failed");

            setRequestPayoutOpen(false);
            setPayoutAmount("");
            fetchEarnings();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPayoutLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400 animate-pulse">Loading earnings data...</div>;
    }

    if (!data) {
        return <div className="p-12 text-center text-red-500">Error loading dashboard</div>;
    }

    const { balances, payouts, ledger } = data;

    return (
        <div className="container mx-auto max-w-6xl px-6 py-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Earnings Dashboard</h1>
                    <p className="text-slate-400">Track your completed jobs and request payouts.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold">
                        DEMO MODE
                    </div>
                    <button
                        onClick={() => setRequestPayoutOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        disabled={balances.availableBalanceCents <= 0}
                    >
                        Request Payout
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">💰</div>
                    <h3 className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Total Earned</h3>
                    <p className="text-3xl font-bold text-white">${(balances.totalEarnedCents / 100).toFixed(2)}</p>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">✅</div>
                    <h3 className="text-emerald-400/80 font-medium text-sm mb-1 uppercase tracking-wider">Available</h3>
                    <p className="text-3xl font-bold text-emerald-400">${(balances.availableBalanceCents / 100).toFixed(2)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">⏳</div>
                    <h3 className="text-yellow-500/80 font-medium text-sm mb-1 uppercase tracking-wider">Pending</h3>
                    <p className="text-3xl font-bold text-yellow-500">${(balances.pendingPayoutsCents / 100).toFixed(2)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">💵</div>
                    <h3 className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider">Paid Out</h3>
                    <p className="text-3xl font-bold text-white">${(balances.paidOutCents / 100).toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payout History */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        Payout History
                    </h2>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4">Date</th>
                                        <th className="px-5 py-4">Amount</th>
                                        <th className="px-5 py-4">Method</th>
                                        <th className="px-5 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {payouts.length === 0 ? (
                                        <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No payouts requested yet.</td></tr>
                                    ) : payouts.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 font-semibold text-white">${(p.amountCents / 100).toFixed(2)}</td>
                                            <td className="px-5 py-3 capitalize">{p.method.replace('mock_', '')}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'processing' ? 'bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20' :
                                                        p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' :
                                                            'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Ledger Activity */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Recent Activity
                    </h2>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            {ledger.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No activity yet.</div>
                            ) : ledger.map((entry: any) => (
                                <div key={entry.id} className="flex justify-between items-center p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {entry.type === 'credit' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{entry.description || (entry.type === 'credit' ? 'Earnings added' : 'Withdrawal')}</p>
                                            <p className="text-slate-500 text-xs">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${entry.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                        {entry.type === 'credit' ? '+' : '-'}${(entry.amountCents / 100).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Payout Modal */}
            {requestPayoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Request Payout</h2>
                            <button onClick={() => setRequestPayoutOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="mb-6 rounded-xl bg-emerald-950/20 p-5 border border-emerald-900/50">
                            <p className="text-sm font-medium text-emerald-400/80 mb-1 tracking-wider uppercase">Available Balance</p>
                            <p className="text-3xl font-bold text-emerald-400">${(balances.availableBalanceCents / 100).toFixed(2)}</p>
                        </div>

                        <form onSubmit={handlePayout}>
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Amount to Withdraw</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        max={(balances.availableBalanceCents / 100).toFixed(2)}
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Payout Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${payoutMethod === 'mock_bank' ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                        <div className="text-2xl mb-1">🏦</div>
                                        <div className="text-xs font-semibold uppercase tracking-wider">Bank Transfer</div>
                                        <input type="radio" value="mock_bank" checked={payoutMethod === 'mock_bank'} onChange={(e) => setPayoutMethod(e.target.value)} className="hidden" />
                                    </label>
                                    <label className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${payoutMethod === 'mock_paypal' ? 'bg-blue-500/10 border-blue-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                        <div className="text-2xl mb-1">🅿️</div>
                                        <div className="text-xs font-semibold uppercase tracking-wider">PayPal</div>
                                        <input type="radio" value="mock_paypal" checked={payoutMethod === 'mock_paypal'} onChange={(e) => setPayoutMethod(e.target.value)} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {error && <p className="mb-5 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500 ring-1 ring-red-500/20">{error}</p>}

                            <button
                                type="submit"
                                disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) <= 0}
                                className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-emerald-500/20"
                            >
                                {payoutLoading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-bottom-transparent" />
                                ) : "Confirm Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
