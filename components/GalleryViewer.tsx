"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession, signOut } from "next-auth/react";
import { GalleryItem } from './GalleryItem';
const ViewerScene = dynamic(() => import('./ViewerScene'), { ssr: false });

interface GalleryViewerProps {
    datasets: any[];
}

export default function GalleryViewer({ datasets }: GalleryViewerProps) {
    const { data: session } = useSession();
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(datasets[0]?.id || null);
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('episode_000');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

    // Animation Loop Refs
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const accumulatorRef = useRef<number>(0);

    // Reset episode when dataset changes
    useEffect(() => {
        if (selectedDataset) {
            setSelectedEpisodeId(selectedDataset.episodes?.[0]?.id || 'episode_000');
        }
    }, [selectedDatasetId, selectedDataset]);

    // Fetch data
    useEffect(() => {
        if (!selectedDatasetId || !selectedEpisodeId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/datasets/${selectedDatasetId}/data?episode=${selectedEpisodeId}`);
                if (!res.ok) throw new Error("Failed to load");
                const json = await res.json();
                setData(json);
                setCurrentFrame(0);
                setIsPlaying(false);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDatasetId, selectedEpisodeId]);

    useEffect(() => {
        const animate = (time: number) => {
            if (lastTimeRef.current !== undefined && data) {
                const deltaTime = time - lastTimeRef.current;

                if (isPlaying) {
                    accumulatorRef.current += deltaTime * playbackSpeed;
                    const msPerFrame = 1000 / data.fps;

                    if (accumulatorRef.current >= msPerFrame) {
                        const framesToAdvance = Math.floor(accumulatorRef.current / msPerFrame);
                        accumulatorRef.current %= msPerFrame;

                        setCurrentFrame(prev => {
                            const next = prev + framesToAdvance;
                            if (next >= data.joint_positions.length) {
                                setIsPlaying(false);
                                return 0;
                            }
                            return next;
                        });
                    }
                }
            }
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [data, isPlaying, playbackSpeed]);

    const currentJoints = data?.joint_positions?.[currentFrame] || [0, 0, 0, 0, 0, 0];

    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans text-gray-200">
            {/* Professional Top Header */}
            <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900 shadow-2xl z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">SO</div>
                    <h1 className="text-[12px] font-black tracking-[0.2em] uppercase text-blue-400">
                        SO-100 <span className="text-white">Motion Exchange</span>
                    </h1>
                </div>
                <nav className="flex items-center gap-8">
                    <div className="flex items-center gap-8 border-r border-white/10 pr-8">
                        <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">Explore</Link>
                        <Link href="/teleop" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">Teleop</Link>
                        {session && (
                            <>
                                {/* @ts-ignore */}
                                {session.user?.roles?.includes('teleoperator') && (
                                    <>
                                        <Link href="/jobs" className="text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">Jobs</Link>
                                        <Link href="/submissions" className="text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Submissions</Link>
                                    </>
                                )}
                                {/* @ts-ignore */}
                                {session.user?.roles?.includes('lab') && (
                                    <Link href="/request" className="text-[11px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors">Request</Link>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                <div className="text-right">
                                    <div className="text-[11px] font-black text-white uppercase tracking-tighter">{session.user?.name || 'User'}</div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-tighter text-left block"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <Link href="/settings/account" className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-blue-400 font-bold">
                                            {session.user?.name?.substring(0, 2).toUpperCase() || 'JD'}
                                        </span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 border border-blue-500/50 rounded-lg text-white/90 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/10 transition-colors flex items-center justify-center"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 bg-blue-600 rounded-lg text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            <div className="flex-grow flex min-h-0">
                {/* Sidebar (Left) - Motion Grid */}
                <div className="w-[380px] shrink-0 flex flex-col bg-slate-900 border-r border-white/5">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Motion Library</span>
                        <div className="flex gap-2">
                            <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[9px] font-bold text-white/40">1</div>
                            <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[9px] font-bold text-white/20">-</div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-950/20">
                        <div className="grid grid-cols-2 gap-4">
                            {datasets.map(d => (
                                <GalleryItem
                                    key={d.id}
                                    dataset={d}
                                    isActive={selectedDatasetId === d.id}
                                    onClick={() => setSelectedDatasetId(d.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-3 border-t border-white/5 bg-slate-900">
                        <input type="text" placeholder="Search..." className="w-full bg-black/40 border border-white/5 rounded px-3 py-1.5 text-[10px] text-white outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                </div>

                {/* Main Visualizer Area (Center) */}
                <div className="flex-grow flex flex-col bg-black min-w-0">
                    <div className="flex-grow relative overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        )}
                        <ViewerScene jointPositions={currentJoints} />
                    </div>

                    {/* Playback Controls Bar (Always In Frame) */}
                    <div className="h-20 shrink-0 bg-slate-900 border-t border-white/5 flex items-center px-6 gap-6 z-20">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all shadow-lg active:scale-95"
                        >
                            {isPlaying ? (
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" /></svg>
                            ) : (
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="ml-1"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" /></svg>
                            )}
                        </button>

                        <div className="flex-grow flex flex-col gap-2">
                            <div className="flex justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest px-1">
                                <span>Frame Progression</span>
                                <span className="text-blue-400">{currentFrame} / {data?.joint_positions.length || 0}</span>
                            </div>
                            <div className="relative h-1.5 group cursor-pointer">
                                <div className="absolute inset-0 bg-white/5 rounded-full" />
                                <div className="absolute h-full bg-blue-600 rounded-full" style={{ width: `${(currentFrame / (data?.joint_positions.length || 1)) * 100}%` }} />
                                <input
                                    type="range" min="0" max={data?.joint_positions.length ? data.joint_positions.length - 1 : 0}
                                    value={currentFrame} onChange={(e) => { setIsPlaying(false); setCurrentFrame(parseInt(e.target.value)) }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                            </div>
                        </div>

                        <select
                            value={selectedEpisodeId} onChange={(e) => setSelectedEpisodeId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-black text-white/50 outline-none cursor-pointer uppercase hover:text-white transition-all min-w-[120px]"
                        >
                            {selectedDataset?.episodes?.map((ep: any) => (
                                <option key={ep.id} value={ep.id} className="bg-slate-900 text-white">{ep.id}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right Settings Panel */}
                <div className="w-[300px] shrink-0 flex flex-col bg-slate-900 border-l border-white/5 p-5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <button className={`w-full py-4 text-[12px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${selectedDataset?.isPremium
                            ? 'bg-[#ff9d00] hover:bg-[#e68a00] text-black shadow-orange-500/10'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
                            }`}>
                            {selectedDataset?.isPremium ? (
                                <span>Purchase for ${selectedDataset.price}</span>
                            ) : (
                                <span>Download Motion</span>
                            )}
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg border border-white/5 transition-all">
                            Trajectory Update
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg border border-white/5 transition-all">
                            Upload Asset
                        </button>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4">Playback Configuration</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-tighter">
                                        <span>Speed</span>
                                        <span className="text-blue-500">{playbackSpeed}x</span>
                                    </div>
                                    <input
                                        type="range" min="0.25" max="2" step="0.25"
                                        value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-widest px-1">Trajectory Metadata</h4>
                            <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 space-y-3">
                                <h3 className="text-[14px] font-bold text-white tracking-tight leading-snug">{selectedDataset?.title}</h3>
                                <p className="text-[11px] text-white/40 leading-relaxed italic">
                                    {selectedDataset?.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 text-center opacity-10">
                        <span className="text-[7px] font-black text-white uppercase tracking-[0.5em]">SO-100 Exchange v1.0.4</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
