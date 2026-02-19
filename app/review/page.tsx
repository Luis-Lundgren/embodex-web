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
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.05),transparent_50%)] p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-mono uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Back to Exchange
                </Link>

                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-200 tracking-tighter mb-4">
                            SUBMISSION REVIEW
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium">
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
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
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
                                    className="grid grid-cols-12 gap-4 items-center bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-900/60 rounded-xl p-4 transition-all duration-200 group"
                                >
                                    <div className="col-span-4">
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                            {payload.title || `Session ${payload.sessionId}`}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                                            ID: {payload.sessionId}
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-sm text-slate-400 truncate">
                                        {sub.email}
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                                        <Clock size={12} />
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 ${statusColor}`}>
                                            {sub.status === 'APPROVED' && <CheckCircle2 size={10} />}
                                            {sub.status === 'REJECTED' && <XCircle size={10} />}
                                            {(!sub.status || sub.status === 'PENDING') && <AlertCircle size={10} />}
                                            {sub.status || 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-purple-400 transition-colors uppercase tracking-widest">
                                            Review &rarr;
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
