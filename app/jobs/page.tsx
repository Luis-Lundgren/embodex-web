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
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] p-4 md:p-12">
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
                        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200 tracking-tighter mb-4 uppercase">
                            Available Jobs
                        </h1>
                        <p className="text-slate-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
                            Browse teleoperation requests from labs and customers. Complete these tasks to earn rewards and build your reputation.
                        </p>
                    </div>
                    <div className="md:text-right w-full md:w-auto p-4 md:p-0 bg-emerald-500/5 md:bg-transparent rounded-2xl border border-emerald-500/10 md:border-0">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Market Status</div>
                        <div className="text-xl md:text-2xl font-mono text-white tracking-tighter">
                            {requests.length} <span className="opacity-40">ACTIVE REQUESTS</span>
                        </div>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-10 md:p-20 text-center backdrop-blur-sm">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="text-slate-600 w-6 h-6 md:w-8 md:h-8" />
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
                                    className="group relative bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 md:p-6 transition-all duration-300 backdrop-blur-sm overflow-hidden"
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

                                        <div className="flex flex-row md:flex-row items-center md:items-center justify-between gap-6 md:gap-8 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                                            <div className="text-left min-w-[80px] md:min-w-[100px]">
                                                <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Budget</div>
                                                <div className="flex items-center justify-start text-lg md:text-xl font-mono text-white">
                                                    <DollarSign size={14} className="text-emerald-500" />
                                                    {payload.budget || "N/A"}
                                                </div>
                                            </div>

                                            <Link
                                                href={req.status === 'in_review' ? '#' : `/teleop?jobId=${req.id}`}
                                                className={`h-10 md:h-12 px-4 md:px-6 rounded-lg md:rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-black text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] ${req.status === 'in_review'
                                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                                    : 'bg-white hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10'
                                                    }`}
                                            >
                                                <span className="md:inline">{req.status === 'in_review' ? 'In Review' : 'Accept Job'}</span>
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
