"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PreviewScene = dynamic(() => import('./PreviewScene'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center text-[10px] text-blue-400 font-mono tracking-widest">LOADING PREVIEW...</div>
});

interface DatasetCardProps {
    dataset: any;
}

export function DatasetCard({ dataset: d }: DatasetCardProps) {
    const [selectedEpisode, setSelectedEpisode] = useState(d.episodes?.[0]?.id || "episode_000");
    const [previewData, setPreviewData] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                // Fetch episode_000 for the preview
                const res = await fetch(`/api/datasets/${d.id}/data?episode=episode_000`);
                if (res.ok) {
                    const json = await res.json();
                    setPreviewData(json);
                }
            } catch (e) {
                console.error("Failed to load preview data", e);
            } finally {
                setLoadingPreview(false);
            }
        };
        fetchPreview();
    }, [d.id]);

    return (
        <div className="group glass-panel h-full hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col">
            {/* Animated Thumbnail Area */}
            <div className="h-48 -mx-6 -mt-6 mb-6 bg-slate-900 overflow-hidden relative border-b border-white/5">
                {previewData ? (
                    <PreviewScene jointPositions={previewData.joint_positions} fps={previewData.fps} />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <div className="text-[10px] text-blue-400 font-mono animate-pulse uppercase tracking-[0.2em]">
                            {loadingPreview ? "Initializing Engine..." : "No Preview Available"}
                        </div>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

                {/* Badge */}
                <div className="absolute top-4 right-4 z-20">
                    {d.isPremium ? (
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg tracking-widest uppercase">
                            PREMIUM
                        </span>
                    ) : (
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase backdrop-blur-sm">
                            FREE
                        </span>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-black mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{d.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 font-medium leading-relaxed">{d.description}</p>
            </div>

            <div className="mt-auto space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">Select Episode</label>
                    <select
                        value={selectedEpisode}
                        onChange={(e) => setSelectedEpisode(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-colors cursor-pointer w-full"
                    >
                        {d.episodes?.map((ep: any) => (
                            <option key={ep.id} value={ep.id} className="bg-slate-900 text-white">
                                {ep.id.toUpperCase()} ({(ep.duration || 0).toFixed(1)}s)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{d.episodes?.length || 0} Episodes</span>
                        <span className="text-[9px] font-mono text-blue-400/60 font-bold uppercase tracking-tighter">Ready to sync</span>
                    </div>
                    <Link
                        href={`/viewer/${d.id}?episode=${selectedEpisode}`}
                        className="bg-blue-500 hover:bg-blue-400 text-black px-4 py-2 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(59,130,246,0.3)] uppercase tracking-widest"
                    >
                        Visualize &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
