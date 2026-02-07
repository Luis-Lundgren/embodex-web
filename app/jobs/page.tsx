import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Clock, DollarSign, ChevronRight, ArrowLeft } from "lucide-react";

export default async function JobsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('teleoperator')) {
        redirect('/');
    }

    // Fetch all requests from customers
    const requests = await prisma.request.findMany({
        where: {
            type: 'request',
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] p-6 md:p-12">
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
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200 tracking-tighter mb-4">
                            AVAILABLE JOBS
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium">
                            Browse teleoperation requests from labs and customers. Complete these tasks to earn rewards and build your reputation.
                        </p>
                    </div>
                    <div className="hidden md:block text-right">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Market Status</div>
                        <div className="text-2xl font-mono text-white tracking-tighter">{requests.length} ACTIVE REQUESTS</div>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-20 text-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="text-slate-600 w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No active jobs found</h2>
                        <p className="text-slate-500">Check back later for new teleoperation requests.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((req) => {
                            const payload = JSON.parse(req.payload);
                            return (
                                <div
                                    key={req.id}
                                    className="group relative bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

                                    <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-3">
                                                {req.status === 'in_review' ? (
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded border border-blue-500/20">
                                                        In Review
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-500/20">
                                                        Open
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                                                    <Clock size={12} />
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors tracking-tight">
                                                {payload.title || "Untitled Request"}
                                            </h3>
                                            <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed max-w-3xl">
                                                {payload.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-8 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                                            <div className="text-center md:text-left min-w-[100px]">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Budget</div>
                                                <div className="flex items-center justify-center md:justify-start text-xl font-mono text-white">
                                                    <DollarSign size={16} className="text-emerald-500" />
                                                    {payload.budget || "N/A"}
                                                </div>
                                            </div>

                                            <Link
                                                href={req.status === 'in_review' ? '#' : `/teleop?jobId=${req.id}`}
                                                className={`h-12 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-black text-[10px] uppercase tracking-[0.2em] ${req.status === 'in_review'
                                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                                        : 'bg-white hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10'
                                                    }`}
                                            >
                                                {req.status === 'in_review' ? 'In Review' : 'Accept Job'}
                                                {req.status !== 'in_review' && <ChevronRight size={14} />}
                                            </Link>
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
