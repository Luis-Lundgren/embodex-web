import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Activity, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('lab')) {
        redirect('/');
    }

    // Fetch all submissions
    const submissions = await prisma.request.findMany({
        where: {
            type: 'submission'
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.05),transparent_50%)] p-4 md:p-12">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 md:mb-12 text-xs md:text-sm font-mono uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Exchange</span>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-6 mb-8 md:mb-12">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-200 tracking-tighter mb-2 md:mb-4 uppercase leading-none">
                            Submission Review
                        </h1>
                        <p className="text-slate-400 text-xs md:text-lg max-w-2xl font-medium leading-relaxed opacity-80">
                            Review and approve teleoperation data submissions from the community.
                        </p>
                    </div>
                </div>

                {submissions.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-20 text-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Activity className="text-slate-600 w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No pending submissions</h2>
                        <p className="text-slate-500">Check back later for new data submissions.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                            <div className="col-span-4">Submission</div>
                            <div className="col-span-3">Submitted By</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        {submissions.map((sub) => {
                            const payload = JSON.parse(sub.payload);
                            const statusColor = sub.status === 'APPROVED' ? 'text-emerald-500' :
                                sub.status === 'REJECTED' ? 'text-red-500' : 'text-blue-500';

                            return (
                                <Link
                                    key={sub.id}
                                    href={`/review/${sub.id}`}
                                    className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-900/60 rounded-xl p-4 md:p-4 transition-all duration-200 group relative"
                                >
                                    <div className="md:col-span-4 w-full">
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors text-sm line-clamp-2 leading-snug">
                                            {payload.title || `Submission for Job ${payload.jobId || sub.id}`}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-mono mt-1 break-all uppercase tracking-tighter opacity-60">
                                            ID: {payload.sessionId || sub.id}
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 text-[10px] md:text-sm text-slate-400 w-full flex items-start gap-2">
                                        <span className="md:hidden text-slate-600 uppercase text-[8px] font-black shrink-0 mt-0.5">By:</span>
                                        <span className="break-all leading-tight">{sub.email}</span>
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-2 text-[10px] md:text-[11px] font-mono text-slate-500">
                                        <Clock size={10} className="md:w-3.5 md:h-3.5 shrink-0" />
                                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 ${statusColor}`}>
                                            {sub.status === 'APPROVED' && <CheckCircle2 size={10} />}
                                            {sub.status === 'REJECTED' && <XCircle size={10} />}
                                            {(!sub.status || sub.status === 'PENDING') && <AlertCircle size={10} />}
                                            {sub.status || 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="md:col-span-1 text-right w-full md:w-auto hidden md:block">
                                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-purple-400 transition-colors uppercase tracking-widest flex items-center justify-end gap-1">
                                            Review <ArrowLeft size={10} className="rotate-180" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
