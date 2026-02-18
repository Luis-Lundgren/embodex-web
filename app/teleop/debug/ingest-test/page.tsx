"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Send, CheckCircle2 } from "lucide-react";

export default function IngestTestPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [response, setResponse] = useState<any>(null);

    const simulateIngest = async () => {
        setStatus("loading");

        const sampleData = {
            robot: "so100",
            session_id: "debug_session_" + Math.random().toString(36).substring(7),
            episode_id: "episode_001",
            fps: 30,
            timestamps: [0.0, 0.033, 0.066, 0.1, 0.133],
            joint_positions: [
                [0, -100, 100, 60, 0, 0],
                [0.1, -99.9, 100, 60.1, 0, 0],
                [0.2, -99.8, 100, 60.2, 0, 0],
                [0.3, -99.7, 100, 60.3, 0, 0],
                [0.4, -99.6, 100, 60.4, 0, 0]
            ],
            metadata: {
                duration: 0.133,
                frame_count: 5
            }
        };

        try {
            const res = await fetch("/api/teleop/session/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sampleData)
            });
            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setResponse(data);
            } else {
                setStatus("error");
                setResponse(data);
            }
        } catch (e) {
            setStatus("error");
            setResponse(e);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-12 text-white">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-12">
                    <ArrowLeft size={16} /> Back
                </Link>

                <h1 className="text-4xl font-black mb-8">Ingestion Debugger</h1>

                <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <p className="text-slate-400 mb-8 font-medium">
                        This page simulates a headset sending its JSON recording directly to our database API.
                        It verifies the new Prisma schema and the ingestion route.
                    </p>

                    <div className="flex gap-4 mb-12">
                        <button
                            onClick={simulateIngest}
                            disabled={status === "loading"}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95"
                        >
                            <Send size={20} />
                            {status === "loading" ? "Processing..." : "Simulate Headset Upload"}
                        </button>
                    </div>

                    {status === "success" && (
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-8 flex items-center gap-4">
                            <CheckCircle2 />
                            <div className="font-mono text-xs">
                                SUCCESS: Data saved to Episode table. <br />
                                Dataset ID: {response.datasetId} <br />
                                Episode ID: {response.episodeId}
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-8 font-mono text-xs">
                            ERROR: {JSON.stringify(response)}
                        </div>
                    )}

                    <div className="border-t border-white/5 pt-8">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Payload Preview</h3>
                        <pre className="bg-black/50 p-6 rounded-2xl text-[10px] text-blue-300 font-mono overflow-auto max-h-64">
                            {JSON.stringify({
                                robot: "so100",
                                session_id: "debug_session_...",
                                trajectory: "[[0, -100, 100, 60, 0, 0], ...]"
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </main>
    );
}
