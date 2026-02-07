import RequestForm from "@/components/Requests/RequestForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function RequestPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('lab')) {
        redirect('/');
    }

    return (
        <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.08),transparent_50%)] p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm font-mono uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Back to Exchange
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500 tracking-tighter mb-4">
                        REQUEST TELEOPERATION
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                        Can't find the data you need? Post a request for custom teleoperations and our global network of operators will provide high-quality trajectories.
                    </p>
                </div>

                <RequestForm />
            </div>
        </main>
    );
}
