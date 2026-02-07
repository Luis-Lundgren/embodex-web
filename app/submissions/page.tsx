import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Send, Clock, CheckCircle2, ArrowLeft, ExternalLink } from "lucide-react";

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
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)] p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-mono uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Back to Exchange
                </Link>

                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 tracking-tighter mb-4">
                            YOUR SUBMISSIONS
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium">
                            Track the trajectories you've recorded and submitted to the marketplace.
                        </p>
                    </div>
                </div>

                {submissions.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-20 text-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Send className="text-slate-600 w-8 h-8" />
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
                            return (
                                <div
                                    key={sub.id}
                                    className="group relative bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded border border-blue-500/20 text-center">
                                                    Submitted
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
                                                    <span className="text-slate-300">{payload.sessionId}</span>
                                                </div>
                                                {payload.jobId && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-700">Job:</span>
                                                        <span className="text-emerald-500/80">#{payload.jobId.substring(0, 8)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={24} />
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
