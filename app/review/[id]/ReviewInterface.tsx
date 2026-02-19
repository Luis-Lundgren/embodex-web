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
    }, [datasetId, selectedEpisodeId]);

    // Animation Loop
    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined && data?.joint_positions?.length) {
            const deltaTime = time - lastTimeRef.current;

            if (isPlaying) {
                accumulatorRef.current += deltaTime * playbackSpeed;
                const msPerFrame = 1000 / (data.fps || 30); // Default to 30fps if missing

                if (accumulatorRef.current >= msPerFrame) {
                    const framesToAdvance = Math.floor(accumulatorRef.current / msPerFrame);
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
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden text-gray-200">
            {/* Header */}
            <header className="h-16 shrink-0 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 z-20 shadow-xl">
                <div className="flex items-center gap-4">
                    <Link href="/review" className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-widest">
                            {requestPayload.title || 'Untitled Session'}
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>{submittedBy}</span>
                            <span>•</span>
                            <span>{new Date(submittedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Episode:</span>
                        <select
                            value={selectedEpisodeId}
                            onChange={(e) => setSelectedEpisodeId(e.target.value)}
                            className="bg-black/40 text-[10px] font-bold border border-white/10 rounded px-2 py-1.5 text-slate-300 outline-none hover:border-white/30 transition-colors cursor-pointer min-w-[100px]"
                        >
                            {episodes.map((ep: any) => (
                                <option key={ep.id} value={ep.id}>
                                    {ep.id} ({(ep.duration || 0).toFixed(1)}s)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => handleAction('APPROVED')}
                            disabled={isSubmitting || status === 'APPROVED'}
                            className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                : 'hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400'
                                }`}
                        >
                            <CheckCircle size={14} />
                            Approve
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => handleAction('REJECTED')}
                            disabled={isSubmitting || status === 'REJECTED'}
                            className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400 cursor-default'
                                : 'hover:bg-red-500/20 hover:text-red-400 text-slate-400'
                                }`}
                        >
                            <XCircle size={14} />
                            Reject
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
                        <div className={`px-4 py-2 rounded-xl border backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg ${status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            {status === 'APPROVED' && <CheckCircle size={16} />}
                            {status === 'REJECTED' && <XCircle size={16} />}
                            {!status || status === 'PENDING' ? <AlertTriangle size={16} /> : null}
                            {status || 'PENDING'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="h-16 shrink-0 bg-slate-900 border-t border-white/10 flex items-center px-6 gap-6 z-20">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 shrink-0 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>

                <div className="flex-grow flex flex-col gap-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
                        <span>Playback Progress</span>
                        <span className="text-purple-400">
                            {currentFrame} / {data?.joint_positions?.length || 0} ({data?.fps ? formatTime(currentFrame, data.fps) : '0.00s'})
                        </span>
                    </div>
                    <div className="relative h-1.5 group cursor-pointer w-full">
                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                        <div
                            className="absolute h-full bg-purple-500 rounded-full transition-all duration-75"
                            style={{ width: `${(currentFrame / ((data?.joint_positions?.length || 1) - 1)) * 100}%` }}
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

                <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                    <button
                        onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                        title="Restart"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase">Speed</span>
                        <select
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="bg-black/30 text-[10px] font-bold border border-white/10 rounded px-2 py-1 text-purple-400 outline-none hover:border-purple-500/50 transition-colors cursor-pointer"
                        >
                            <option value="0.25">0.25x</option>
                            <option value="0.5">0.5x</option>
                            <option value="1">1.0x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2.0x</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
