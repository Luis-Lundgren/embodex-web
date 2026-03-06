'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, Play, X, Send } from 'lucide-react';

const ViewerScene = dynamic(() => import('../ViewerScene'), { ssr: false });

interface SessionReviewProps {
    sessionId: string;
    jobId?: string | null;
    onClose: () => void;
}

export default function SessionReview({ sessionId, jobId, onClose }: SessionReviewProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [rawPayload, setRawPayload] = useState<any>(null);

    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch(`/api/teleop/sessions?sessionId=${sessionId}`);
                const json = await res.json();
                setRawPayload(json);

                let jointPositions = [];

                if (json.episodes && json.episodes[0]) {
                    jointPositions = json.episodes[0].joint_positions || [];
                } else if (json.joint_positions) {
                    jointPositions = json.joint_positions;
                } else if (Array.isArray(json)) {
                    jointPositions = json;
                }

                setData({
                    joint_positions: jointPositions,
                    fps: json.fps || 30
                });
            } catch (e) {
                console.error("Failed to load session for review", e);
            } finally {
                setLoading(false);
            }
        }
        loadSession();
    }, [sessionId]);

    useEffect(() => {
        let timer: any;
        if (isPlaying && data?.joint_positions) {
            timer = setInterval(() => {
                setCurrentFrame(prev => {
                    if (prev >= (data.joint_positions?.length || 0) - 1) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000 / (data.fps || 30));
        }
        return () => clearInterval(timer);
    }, [isPlaying, data]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let currentDatasetId = rawPayload?.datasetId;
            let currentEpisodeId = rawPayload?.episodeId;

            if (!currentDatasetId || !currentEpisodeId) {
                // 1. Ingest into Cloud Database (only if not already there)
                const ingestRes = await fetch('/api/teleop/session/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...rawPayload,
                        session_id: sessionId,
                        jobId: jobId
                    })
                });

                if (!ingestRes.ok) {
                    throw new Error("Ingestion failed");
                }

                const ingestData = await ingestRes.json();
                currentDatasetId = ingestData.datasetId;
                currentEpisodeId = ingestData.episodeId;
            } else {
                console.log("Session already in cloud DB, skipping ingest.");
            }

            // 2. Create Submission Request
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'submission',
                    payload: {
                        sessionId,
                        jobId,
                        datasetId: currentDatasetId,
                        episodeId: currentEpisodeId,
                        title: `Submission for Job ${jobId || 'Unknown'}`,
                        recordedAt: new Date().toISOString()
                    }
                })
            });

            if (res.ok) {
                setSubmitted(true);
                setTimeout(onClose, 2000);
            }
        } catch (e) {
            console.error(e);
            alert("Submission failed during cloud sync.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-4">
            <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90dvh] md:h-[80vh]">
                <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">Review Session</h2>
                        {jobId && <p className="text-emerald-400 text-[10px] font-mono uppercase mt-0.5">Job #{jobId}</p>}
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow relative bg-black">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 font-mono italic">
                            Buffering trajectory data...
                        </div>
                    ) : (
                        <ViewerScene jointPositions={data?.joint_positions?.[currentFrame] || [0, 0, 0, 0, 0, 0]} />
                    )}

                    {/* Simple Playback Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg"
                        >
                            {isPlaying ? <span className="font-bold">||</span> : <Play fill="white" size={16} />}
                        </button>
                        <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-100"
                                style={{ width: `${(currentFrame / (data?.joint_positions?.length || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="text-[10px] font-mono text-white/40">
                            {currentFrame} / {data?.joint_positions?.length || 0}
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8 border-t border-white/5 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-slate-400 text-[11px] md:text-sm max-w-md leading-relaxed text-center md:text-left">
                        Verify the trajectory alignment before submitting.
                    </div>
                    <div className="flex w-full md:w-auto gap-3 md:gap-4">
                        <button
                            disabled={submitting || submitted}
                            onClick={onClose}
                            className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-white/50 hover:text-white text-[11px] md:text-sm font-bold uppercase tracking-widest transition-colors border border-white/10 rounded-xl"
                        >
                            Discard
                        </button>
                        <button
                            disabled={submitting || submitted || !data}
                            onClick={handleSubmit}
                            className={`flex-[2] md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl font-black text-[11px] md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${submitted
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
                                }`}
                        >
                            {submitted ? (
                                <><CheckCircle2 size={16} /> Submitted!</>
                            ) : submitting ? (
                                'Uploading...'
                            ) : (
                                <><Send size={16} /> Submit</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
