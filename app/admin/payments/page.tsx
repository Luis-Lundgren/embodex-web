"use client";

import { useState, useEffect } from "react";

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        try {
            // we could add query params here for filtering, but let's fetch all for the demo
            const res = await fetch("/api/admin/payments");
            const data = await res.json();
            if (data.success) {
                setPayments(data.payments);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleStatusChange = async (paymentId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/admin/payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, status: newStatus })
            });
            if (res.ok) {
                // refresh table
                fetchPayments();
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
                    <p className="text-slate-400">Admin controls for all mock purchases and payouts.</p>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 animate-pulse font-mono tracking-widest text-sm uppercase">Loading Payments...</div>
            ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                            <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500 font-bold tracking-widest border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Transaction ID</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Current Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No payments found.
                                        </td>
                                    </tr>
                                ) : payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{p.transactionId}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-200">{p.user?.name || 'Unknown'}</div>
                                            <div className="text-[11px] text-slate-500">{p.user?.email || ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.role === 'lab' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                }`}>
                                                {p.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 capitalize font-medium text-slate-300">{p.type.replace('_', ' ')}</td>
                                        <td className="px-6 py-4 font-bold text-white text-right">${(p.amountCents / 100).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-slate-400 text-xs">{(p.method || "").replace('mock_', '').toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'succeeded' || p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    p.status === 'processing' || p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {p.type === 'payout' && p.status === 'processing' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(p.id, 'paid')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-lg shadow-emerald-500/20">Mark Paid</button>
                                                    <button onClick={() => handleStatusChange(p.id, 'failed')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">Fail</button>
                                                </>
                                            )}
                                            {p.type !== 'payout' && p.status === 'pending' && (
                                                <button onClick={() => handleStatusChange(p.id, 'succeeded')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors">Complete</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
