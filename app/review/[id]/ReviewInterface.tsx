"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Play, Pause, RotateCcw, SkipForward, SkipBack } from 'lucide-react';

const ViewerScene = dynamic(() => import('@/components/ViewerScene'), { ssr: false });

interface ReviewInterfaceProps {
    requestId: string;
    datasetId: string;
    episodes: any[];
    initialStatus: string;
    requestPayload: any;
    submittedBy: string;
    submittedAt: string;
}

export default function ReviewInterface({
    requestId,
    datasetId,
    episodes,
    initialStatus,
    requestPayload,
    submittedBy,
    submittedAt
}: ReviewInterfaceProps) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(initialStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Episode selection
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(episodes[0]?.id || '');

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Refs
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const accumulatorRef = useRef<number>(0);

    // Fetch Motion Data
    useEffect(() => {
        const fetchData = async () => {
            if (!datasetId || !selectedEpisodeId) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/datasets/${datasetId}/data?episode=${selectedEpisodeId}`);
                if (!res.ok) throw new Error("Failed to load motion data");
                let json = await res.json();
                console.log("Motion Data Received:", json);

                // Handle nested episodes structure
                if (json.episodes && Array.isArray(json.episodes) && json.episodes.length > 0) {
                    console.log("Extracting episode from nested structure");
                    const matchingEpisode = json.episodes.find((e: any) => e.episode_id === selectedEpisodeId) || json.episodes[0];
                    if (matchingEpisode) {
                        json = matchingEpisode;
                    }
                }

                // Validate data structure
                if (!json || !Array.isArray(json.joint_positions)) {
                    console.error("Invalid data format:", json);
                    alert("Received invalid motion data format");
                    return;
                }

                setData(json);
                setCurrentFrame(0);
                setIsPlaying(false);
            } catch (e) {
                console.error("Fetch error:", e);
                alert("Error loading motion data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [datasetId, selectedEpisodeId]);

    // Animation Loop
    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined && data?.joint_positions?.length) {
            const deltaTime = time - lastTimeRef.current;

            if (isPlaying) {
                accumulatorRef.current += deltaTime * playbackSpeed;
                const msPerFrame = 1000 / (data.fps || 30); // Default to 30fps if missing

                if (accumulatorRef.current >= msPerFrame) {
                    const framesToAdvance = Math.max(1, Math.floor(accumulatorRef.current / msPerFrame));
                    accumulatorRef.current %= msPerFrame;

                    setCurrentFrame(prev => {
                        const next = prev + framesToAdvance;
                        if (next >= data.joint_positions.length) {
                            setIsPlaying(false);
                            return 0; // Loop or stop? Let's loop
                        }
                        return next;
                    });
                }
            }
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [data, isPlaying, playbackSpeed]);

    // Actions
    const handleAction = async (newStatus: 'APPROVED' | 'REJECTED') => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${requestId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setStatus(newStatus);
                router.refresh(); // Refresh server data
                router.push('/review'); // Go back to list? Or stay? Let's go back to list for workflow efficiency
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating status");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentJoints = data?.joint_positions?.[currentFrame] || [0, 0, 0, 0, 0, 0];
    const formatTime = (frame: number, fps: number) => (frame / fps).toFixed(2) + "s";

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-950 overflow-hidden text-gray-200 z-0 h-screen h-[100dvh]">
            {/* Header */}
            <header className="h-auto md:h-16 shrink-0 bg-slate-900 border-b border-white/10 flex flex-col md:flex-row items-center justify-between p-4 md:px-6 z-20 shadow-xl gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/review" className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-[11px] md:text-sm font-black text-white uppercase tracking-widest truncate">
                            {requestPayload.title || 'Untitled Session'}
                        </h1>
                        <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-slate-500 font-mono">
                            <span className="truncate max-w-[100px] md:max-w-none">{submittedBy}</span>
                            <span>•</span>
                            <span className="shrink-0">{new Date(submittedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Episode:</span>
                        <select
                            value={selectedEpisodeId}
                            onChange={(e) => setSelectedEpisodeId(e.target.value)}
                            className="bg-black/40 text-[10px] font-bold border border-white/10 rounded px-2 py-1.5 text-slate-300 outline-none hover:border-white/30 transition-colors cursor-pointer min-w-[80px]"
                        >
                            {episodes.map((ep: any) => (
                                <option key={ep.id} value={ep.id}>
                                    {ep.id.substring(0, 8)}... ({(ep.duration || 0).toFixed(1)}s)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5 shrink-0">
                        <button
                            onClick={() => handleAction('APPROVED')}
                            disabled={isSubmitting || status === 'APPROVED'}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                : 'hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400'
                                }`}
                        >
                            <CheckCircle size={12} className="md:w-3.5 md:h-3.5" />
                            <span className="hidden xs:inline">Approve</span>
                        </button>
                        <div className="w-px h-5 md:h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => handleAction('REJECTED')}
                            disabled={isSubmitting || status === 'REJECTED'}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400 cursor-default'
                                : 'hover:bg-red-500/20 hover:text-red-400 text-slate-400'
                                }`}
                        >
                            <XCircle size={12} className="md:w-3.5 md:h-3.5" />
                            <span className="hidden xs:inline">Reject</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex min-h-0">
                {/* 3D Viewer */}
                <div className="flex-grow relative bg-black">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full" />
                        </div>
                    )}
                    <ViewerScene jointPositions={currentJoints} />

                    {/* Status Overlay */}
                    <div className="absolute top-4 right-4 pointer-events-none">
                        <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl border backdrop-blur-md flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg ${status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            {status === 'APPROVED' && <CheckCircle size={14} className="md:w-4 md:h-4" />}
                            {status === 'REJECTED' && <XCircle size={14} className="md:w-4 md:h-4" />}
                            {!status || status === 'PENDING' ? <AlertTriangle size={14} className="md:w-4 md:h-4" /> : null}
                            {status || 'PENDING'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="h-20 sm:h-16 shrink-0 bg-slate-900 border-t border-white/10 flex items-center px-4 md:px-6 gap-4 md:gap-6 z-20 pb-[env(safe-area-inset-bottom)]">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>

                <div className="flex-grow flex flex-col gap-1.5 min-w-0">
                    <div className="flex justify-between text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
                        <span className="hidden sm:inline">Playback Progress</span>
                        <span className="sm:hidden truncate">Progress</span>
                        <span className="text-purple-400 font-bold">
                            {currentFrame} <span className="opacity-40">/</span> {data?.joint_positions?.length || 0}
                        </span>
                    </div>
                    <div className="relative h-1.5 group cursor-pointer w-full">
                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                        <div
                            className="absolute h-full bg-purple-500 rounded-full transition-all duration-75"
                            style={{ width: `${(currentFrame / (Math.max((data?.joint_positions?.length || 1) - 1, 1))) * 100}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max={data?.joint_positions?.length ? data.joint_positions.length - 1 : 0}
                            value={currentFrame}
                            onChange={(e) => { setIsPlaying(false); setCurrentFrame(parseInt(e.target.value)); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 border-l border-white/10 pl-4 md:pl-6 shrink-0">
                    <button
                        onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-white transition-colors"
                        title="Restart"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase hidden xs:inline">Speed</span>
                        <select
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="bg-black/30 text-[9px] md:text-[10px] font-bold border border-white/10 rounded px-1.5 md:px-2 py-1 text-purple-400 outline-none hover:border-purple-500/50 transition-colors cursor-pointer"
                        >
                            <option value="0.5">0.5x</option>
                            <option value="1">1.0x</option>
                            <option value="2">2.0x</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
