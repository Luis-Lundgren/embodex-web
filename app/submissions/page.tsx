import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Send, Clock, CheckCircle2, XCircle, Activity, ArrowLeft, RotateCcw } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default async function SubmissionsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('teleoperator')) {
        redirect('/');
    }

    // Fetch all submissions from this user
    const submissions = await prisma.request.findMany({
        where: {
            type: 'submission',
            email: session.user.email!
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)] p-4 md:p-12">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 md:mb-12 text-xs md:text-sm font-mono uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Exchange</span>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 tracking-tighter mb-4 uppercase">
                            Your Submissions
                        </h1>
                        <p className="text-slate-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
                            Track the trajectories you've recorded and submitted to the marketplace.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </div>

                {submissions.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-10 md:p-20 text-center backdrop-blur-sm">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Send className="text-slate-600 w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No submissions yet</h2>
                        <p className="text-slate-500">Go to the Jobs board to find tasks and start teleoperating!</p>
                        <Link
                            href="/jobs"
                            className="inline-block mt-8 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {submissions.map((sub) => {
                            const payload = JSON.parse(sub.payload);
                            const status = sub.status || 'PENDING';

                            let statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                            let StatusIcon = Activity;

                            if (status === 'APPROVED') {
                                statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                                StatusIcon = CheckCircle2;
                            } else if (status === 'REJECTED') {
                                statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                                StatusIcon = XCircle;
                            }

                            return (
                                <div
                                    key={sub.id}
                                    className={`group relative bg-slate-900/50 border hover:border-blue-500/30 rounded-2xl p-5 md:p-6 transition-all duration-300 backdrop-blur-sm ${status === 'REJECTED' ? 'border-red-500/10' : 'border-slate-800'}`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border text-center ${statusColor}`}>
                                                    {status}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                                                    <Clock size={12} />
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors tracking-tight">
                                                {payload.title || `Submission: ${payload.sessionId}`}
                                            </h3>
                                            <div className="flex flex-wrap gap-4 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-700">Session:</span>
                                                    <span className={`truncate max-w-[150px] ${status === 'REJECTED' ? 'text-red-500/50' : 'text-slate-300'}`}>
                                                        {payload.sessionId}
                                                    </span>
                                                </div>
                                                {payload.jobId && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-700">Job:</span>
                                                        <span className="text-emerald-500/80">#{payload.jobId.substring(0, 8)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {status === 'REJECTED' && payload.jobId && (
                                                <div className="mt-4 pt-4 border-t border-red-500/10 flex items-center gap-4">
                                                    <p className="text-xs text-red-400 font-medium">This submission was rejected by the lab.</p>
                                                    <Link
                                                        href={`/teleop?jobId=${payload.jobId}`}
                                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Re-record Job
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0 md:bg-black/20 md:p-4 rounded-xl">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${status === 'APPROVED' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' :
                                                status === 'REJECTED' ? 'bg-red-500/10 border border-red-500/20 text-red-500' :
                                                    'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                                                }`}>
                                                <StatusIcon size={20} className="md:w-6 md:h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
