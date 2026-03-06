"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Play, Pause, ChevronRight, Search, Download, CreditCard, RefreshCw, Upload, Info, Settings2 } from 'lucide-react';
import { GalleryItem } from './GalleryItem';
import NotificationBell from './NotificationBell';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <div className="fixed inset-0 flex flex-col bg-slate-950 overflow-hidden font-sans text-gray-200 z-0 h-screen h-[100dvh]">
            {/* Professional Top Header */}
            <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-slate-900 shadow-2xl z-40 relative">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">SO</div>
                    <h1 className="text-[10px] md:text-[12px] font-black tracking-[0.1em] md:tracking-[0.2em] uppercase text-blue-400">
                        SO-100 <span className="text-white">Motion Exchange</span>
                    </h1>
                </div>
                <nav className="flex items-center gap-4 md:gap-8">
                    <div className="hidden lg:flex items-center gap-8 border-r border-white/10 pr-8">
                        <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">Explore</Link>
                        <Link href="/teleop" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">Teleop</Link>
                        {session && (
                            <>
                                {/* @ts-ignore */}
                                {session.user?.roles?.includes('teleoperator') && (
                                    <>
                                        <Link href="/jobs" className="text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">Jobs</Link>
                                        <Link href="/submissions" className="text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Submissions</Link>
                                        <Link href="/teleop/earnings" className="text-[11px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors">Earnings</Link>
                                    </>
                                )}
                                {/* @ts-ignore */}
                                {session.user?.roles?.includes('lab') && (
                                    <>
                                        <Link href="/request" className="text-[11px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors">Request</Link>
                                        <Link href="/review" className="text-[11px] font-black uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors">Review</Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {session ? (
                            <>
                                <div className="hidden sm:block text-right">
                                    <div className="text-[11px] font-black text-white uppercase tracking-tighter">{session.user?.name || 'User'}</div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-tighter text-left block"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <NotificationBell />
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
                            <div className="flex items-center gap-2 md:gap-3">
                                <Link
                                    href="/login"
                                    className="px-3 md:px-4 py-2 border border-blue-500/50 rounded-lg text-white/90 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/10 transition-colors flex items-center justify-center font-sans"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-3 md:px-4 py-2 bg-blue-600 rounded-lg text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center font-sans"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                        <button
                            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-14 left-0 w-full bg-slate-900 border-b border-white/10 p-6 flex flex-col gap-6 lg:hidden z-50 animate-in slide-in-from-top duration-200">
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Navigation</span>
                            <Link href="/" className="text-sm font-bold uppercase tracking-widest text-white/80" onClick={() => setIsMenuOpen(false)}>Explore</Link>
                            <Link href="/teleop" className="text-sm font-bold uppercase tracking-widest text-white/80" onClick={() => setIsMenuOpen(false)}>Teleop</Link>
                            {session && (
                                <>
                                    {/* @ts-ignore */}
                                    {session.user?.roles?.includes('teleoperator') && (
                                        <>
                                            <Link href="/jobs" className="text-sm font-bold uppercase tracking-widest text-emerald-400" onClick={() => setIsMenuOpen(false)}>Jobs</Link>
                                            <Link href="/submissions" className="text-sm font-bold uppercase tracking-widest text-blue-400" onClick={() => setIsMenuOpen(false)}>Submissions</Link>
                                            <Link href="/teleop/earnings" className="text-sm font-bold uppercase tracking-widest text-amber-400" onClick={() => setIsMenuOpen(false)}>Earnings</Link>
                                        </>
                                    )}
                                    {/* @ts-ignore */}
                                    {session.user?.roles?.includes('lab') && (
                                        <>
                                            <Link href="/request" className="text-sm font-bold uppercase tracking-widest text-purple-400" onClick={() => setIsMenuOpen(false)}>Request</Link>
                                            <Link href="/review" className="text-sm font-bold uppercase tracking-widest text-pink-400" onClick={() => setIsMenuOpen(false)}>Review</Link>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        {session && (
                            <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Account</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden">
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-blue-400 font-bold">{session.user?.name?.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{session.user?.name}</div>
                                        <div className="text-xs text-white/40">{session.user?.email}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                                    className="text-left text-sm font-bold text-red-400 uppercase tracking-widest mt-2"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <div className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden relative">
                {/* Sidebar (Left) - Motion Grid */}
                <div className={`
                    absolute inset-0 z-30 bg-slate-900 transition-transform duration-300 transform md:relative md:translate-x-0 md:z-0
                    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-full md:w-[320px] lg:w-[380px] shrink-0 flex flex-col border-r border-white/5
                `}>
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Motion Library</span>
                        <div className="flex gap-2">
                            <div className="w-5 h-5 bg-white/5 rounded flex items-center justify-center text-[9px] font-bold text-white/40">1</div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="md:hidden w-5 h-5 bg-blue-600/20 rounded flex items-center justify-center text-[9px] font-bold text-blue-400"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-950/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                            {datasets.map(d => (
                                <GalleryItem
                                    key={d.id}
                                    dataset={d}
                                    isActive={selectedDatasetId === d.id}
                                    onClick={() => { setSelectedDatasetId(d.id); setIsMenuOpen(false); }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-3 border-t border-white/5 bg-slate-900">
                        <div className="relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="text" placeholder="Search..." className="w-full bg-black/40 border border-white/5 rounded pl-8 pr-3 py-1.5 text-[10px] text-white outline-none focus:ring-1 focus:ring-blue-500/50" />
                        </div>
                    </div>
                </div>

                {/* Main Visualizer Area (Center) */}
                <div className="flex-grow flex flex-col bg-black min-w-0 relative pb-16 md:pb-0">
                    <div className="flex-grow relative overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        )}
                        <ViewerScene jointPositions={currentJoints} />

                        {/* Mobile Overlay Toggle for Library */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden absolute top-4 left-4 z-20 px-3 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 shadow-xl"
                        >
                            <Menu size={14} /> Library
                        </button>
                    </div>

                    {/* Playback Controls Bar (Always In Frame) */}
                    <div className="h-16 md:h-20 shrink-0 bg-slate-900 border-t border-white/5 flex items-center px-4 md:px-6 gap-2 md:gap-6 z-50 pb-[env(safe-area-inset-bottom)] fixed bottom-0 left-0 right-0 md:relative md:bottom-auto">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all shadow-lg active:scale-95"
                        >
                            {isPlaying ? (
                                <Pause size={14} className="md:w-[18px] md:h-[18px]" fill="currentColor" />
                            ) : (
                                <Play size={14} className="md:w-[18px] md:h-[18px] ml-1" fill="currentColor" />
                            )}
                        </button>

                        <div className="flex-grow flex flex-col gap-1 md:gap-2 min-w-0">
                            <div className="flex justify-between text-[7px] md:text-[9px] font-mono text-white/30 uppercase tracking-widest px-1">
                                <span className="hidden sm:inline">Frame Progression</span>
                                <span className="sm:hidden">Progress</span>
                                <span className="text-blue-400">
                                    {currentFrame} <span className="opacity-40">/</span> {data?.joint_positions.length || 0}
                                </span>
                            </div>
                            <div className="relative h-1 md:h-1.5 group cursor-pointer">
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
                            className="bg-white/5 border border-white/10 rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-[8px] md:text-[10px] font-black text-white/50 outline-none cursor-pointer uppercase hover:text-white transition-all max-w-[70px] md:max-w-none md:min-w-[120px]"
                        >
                            {selectedDataset?.episodes?.map((ep: any) => (
                                <option key={ep.id} value={ep.id} className="bg-slate-900 text-white">
                                    {ep.id.replace('episode_', 'EP ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right Settings Panel */}
                <div className="hidden xl:flex w-[300px] shrink-0 flex-col bg-slate-900 border-l border-white/5 p-5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <button className={`w-full py-4 text-[12px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${selectedDataset?.isPremium
                            ? 'bg-[#ff9d00] hover:bg-[#e68a00] text-black shadow-orange-500/10'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
                            }`}>
                            {selectedDataset?.isPremium ? (
                                <><CreditCard size={14} /> <span>Purchase for ${selectedDataset.price}</span></>
                            ) : (
                                <><Download size={14} /> <span>Download</span></>
                            )}
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={14} /> Trajectory Update
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg border border-white/5 transition-all flex items-center justify-center gap-2">
                            <Upload size={14} /> Upload Asset
                        </button>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Settings2 size={12} /> Playback Configuration
                            </h4>
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
                            <h4 className="text-[11px] font-black text-white/30 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Info size={12} /> Trajectory Metadata
                            </h4>
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
