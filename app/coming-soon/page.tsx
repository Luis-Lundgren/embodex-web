"use client";

import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function ComingSoonPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 text-center">
            <div className="relative z-10 max-w-lg w-full">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 backdrop-blur-xl shadow-2xl">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                        <Construction className="w-10 h-10 text-blue-400" />
                    </div>

                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4 tracking-tight">
                        AUTHENTICATION<br />COMING SOON
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed mb-10">
                        We are currently perfecting the secure workspace for teleoperators and labs. Check back soon for the full release.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Motion Exchange
                    </Link>
                </div>
            </div>

            {/* Background embellishments */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[100px] delay-700" />
            </div>
        </main>
    );
}
