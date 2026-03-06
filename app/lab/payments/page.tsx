import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LabPaymentsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { roles: true }
    });

    if (!user?.roles.some(r => r.role === 'lab')) {
        redirect('/');
    }

    const payments = await prisma.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="container mx-auto max-w-6xl px-6 py-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payment History</h1>
                    <p className="text-slate-400">View your mock purchases and funded requests for demos.</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold self-start">
                    DEMO MODE
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
                        <thead className="bg-slate-950/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">Transaction ID</th>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Type</th>
                                <th className="px-6 py-5">Item Ref</th>
                                <th className="px-6 py-5">Amount</th>
                                <th className="px-6 py-5">Method</th>
                                <th className="px-6 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            No mock payments found.
                                        </div>
                                    </td>
                                </tr>
                            ) : payments.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                            {p.transactionId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 capitalize font-medium text-slate-200">
                                        {p.type.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.referenceType ? (
                                            <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                                                {p.referenceType}
                                            </span>
                                        ) : <span className="text-slate-600">-</span>}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-white">
                                        ${(p.amountCents / 100).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg leading-none">{p.method === 'mock_card' ? '💳' : '🏦'}</span>
                                            <span className="capitalize text-slate-400">{p.method.replace('mock_', '')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === 'succeeded' || p.status === 'paid' ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' :
                                                p.status === 'failed' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.status === 'succeeded' || p.status === 'paid' ? 'bg-green-400' :
                                                    p.status === 'failed' ? 'bg-red-400' : 'bg-yellow-500'
                                                }`}></span>
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
    );
}
