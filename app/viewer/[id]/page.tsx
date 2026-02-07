"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

const ViewerScene = dynamic(() => import('@/components/ViewerScene'), { ssr: false });

export default function ViewerPage({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const episodeId = searchParams.get('episode') || 'episode_000';

    const [loading, setLoading] = useState(true);
    const [datasetMetadata, setDatasetMetadata] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Ref for animation loop
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const accumulatorRef = useRef<number>(0);

    useEffect(() => {
        // Fetch metadata once
        const fetchMetadata = async () => {
            try {
                const res = await fetch(`/api/datasets/${params.id}`);
                const json = await res.json();
                setDatasetMetadata(json);
            } catch (e) {
                console.error("Failed to load metadata", e);
            }
        };
        fetchMetadata();
    }, [params.id]);

    useEffect(() => {
        // Fetch data when episode changes
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/datasets/${params.id}/data?episode=${episodeId}`);
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
    }, [params.id, episodeId]);

    // Animation Loop
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

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [data, isPlaying, playbackSpeed]);


    if (loading && !data) return <div className="flex h-screen items-center justify-center text-blue-400 font-mono animate-pulse">LOADING DATASET...</div>;
    if (!data) return <div className="flex h-screen items-center justify-center text-red-500 font-mono">ERROR LOADING DATASET</div>;

    const currentJoints = data?.joint_positions?.[currentFrame] || [0, 0, 0, 0, 0, 0];

    const formatTime = (frame: number, fps: number) => {
        const s = frame / fps;
        return s.toFixed(2) + "s";
    };

    const handleEpisodeChange = (newEpisode: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('episode', newEpisode);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-950 z-[100] overflow-hidden">
            {/* Header */}
            <header className="glass p-4 flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg">
                        &larr; Exit
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 px-2 py-1 rounded text-[10px] font-black text-blue-400 border border-blue-500/30 tracking-tighter uppercase">
                            Episode Selector
                        </div>
                        <select
                            value={episodeId}
                            onChange={(e) => handleEpisodeChange(e.target.value)}
                            className="bg-black/50 text-white font-bold border border-white/10 rounded-lg px-4 py-2 outline-none hover:border-blue-500/50 transition-colors cursor-pointer min-w-[200px]"
                        >
                            {datasetMetadata?.episodes?.map((ep: any) => (
                                <option key={ep.id} value={ep.id}>
                                    {ep.id.toUpperCase()} ({(ep.duration || 0).toFixed(1)}s)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="hidden lg:block">
                        <h1 className="text-xs font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Dataset</h1>
                        <div className="text-sm font-black text-white">{datasetMetadata?.title || "Loading..."}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-mono text-gray-400">
                            {data.joint_positions.length} FRAMES @ {data.fps}HZ
                        </div>
                        <div className="text-xs font-mono text-blue-400">
                            TOTAL DURATION: {formatTime(data.joint_positions.length, data.fps)}
                        </div>
                    </div>
                    <button className="btn-primary text-[10px] py-1.5 px-4 shadow-none border border-white/10 hover:border-white/50 uppercase tracking-widest">
                        Export JSON
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex relative">
                {/* 3D Viewer */}
                <div className="flex-grow relative bg-gray-900">
                    {loading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                            <div className="text-blue-400 font-mono animate-pulse tracking-widest">SWITCHING EPISODE...</div>
                        </div>
                    )}
                    <ViewerScene jointPositions={currentJoints} />

                    {/* Joint Values Overlay (Left) */}
                    <div className="absolute top-4 left-4 p-5 glass rounded-2xl pointer-events-none border border-white/5 w-48">
                        <div className="text-[10px] font-black text-blue-400 mb-3 tracking-[0.2em] uppercase border-b border-white/5 pb-2">Joint State</div>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono">
                            <span className="text-white/40 uppercase">Base</span>
                            <span className="text-white text-right">{currentJoints[0]?.toFixed(1)}&deg;</span>

                            <span className="text-white/40 uppercase">Shoulder</span>
                            <span className="text-white text-right">{currentJoints[1]?.toFixed(1)}&deg;</span>

                            <span className="text-white/40 uppercase">Elbow</span>
                            <span className="text-white text-right">{currentJoints[2]?.toFixed(1)}&deg;</span>

                            <span className="text-white/40 uppercase">Wrist P</span>
                            <span className="text-white text-right">{currentJoints[3]?.toFixed(1)}&deg;</span>

                            <span className="text-white/40 uppercase">Wrist R</span>
                            <span className="text-white text-right">{currentJoints[4]?.toFixed(1)}&deg;</span>

                            <span className="text-white/40 uppercase">Gripper</span>
                            <span className="text-white text-right">{currentJoints[5]?.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 pt-2 border-t border-white/5 text-[10px] text-blue-300 font-bold flex justify-between">
                            <span>STATUS</span>
                            <span className="animate-pulse">{isPlaying ? "PLAYING" : "PAUSED"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline / Controls */}
            <div className="glass p-6 border-t border-white/10 z-20 backdrop-blur-xl bg-black/40">
                <div className="flex flex-col gap-4 max-w-5xl mx-auto">
                    {/* Scrubber */}
                    <div className="relative group">
                        <input
                            type="range"
                            min="0"
                            max={data.joint_positions.length - 1}
                            value={currentFrame}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentFrame(parseInt(e.target.value));
                            }}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-400 hover:accent-blue-300 transition-all"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 min-w-[120px]">
                            <div className="px-3 py-1 bg-white/5 rounded-md border border-white/10 font-mono text-sm text-blue-400">
                                {formatTime(currentFrame, data.fps)}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Go to Start */}
                            <button
                                onClick={() => {
                                    setIsPlaying(false);
                                    setCurrentFrame(0);
                                }}
                                className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Go to Start"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.52-.302 1.167.1.167.687v7.402c0 .588-.647.99-1.167.688L5 8.752V12a.5.5 0 0 1-1 0V4z" />
                                </svg>
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 rounded-full bg-blue-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-110 active:scale-95 transition-all outline-none"
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="ml-1" viewBox="0 0 16 16">
                                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
                                    </svg>
                                )}
                            </button>

                            {/* Go to End */}
                            <button
                                onClick={() => {
                                    setIsPlaying(false);
                                    setCurrentFrame(data.joint_positions.length - 1);
                                }}
                                className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Go to End"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.713 3.31 4.067 3.712 4.067 4.3v7.402c0 .588.647.99 1.167.688L11.5 8.752V12a.5.5 0 0 0 1 0V4z" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 min-w-[120px] justify-end">
                            <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Speed</span>
                            <select
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                className="bg-white/5 text-xs font-bold border border-white/10 rounded px-3 py-1.5 text-blue-400 outline-none hover:border-blue-500/50 transition-colors"
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
        </div>
    );
}
