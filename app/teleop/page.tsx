"use client";

import { useTeleopClient } from "@/components/Teleop/TeleopClient";
import { VRScene } from "@/components/Teleop/VRScene";
import { TeleopControls } from "@/components/Teleop/Controls";
import SessionReview from "@/components/Teleop/SessionReview";
import { TELEGRIP_WS_URL, TELEGRIP_HTTP_URL } from "@/lib/config";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function TeleopContent() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');

    const [robotState, setRobotState] = useState<any>(null);
    const [status, setStatus] = useState({
        connected: false,
        robotEngaged: false,
        recording: false
    });

    const [detecting, setDetecting] = useState(false);

    const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
    const wasRecording = useRef(false);

    // Check roles and redirect if needed
    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
        }
        // During dev/after reset, we'll be more lenient with roles on the teleop page
    }, [authStatus, router]);

    const handleRobotState = useCallback((state: any) => {
        setRobotState(state);
        // Update local status from backend state
        if (state) {
            setStatus(prev => ({
                ...prev,
                recording: state.recording
            }));
        }
    }, []);

    // Detect when recording session finishes
    useEffect(() => {
        if (wasRecording.current && !status.recording) {
            setDetecting(true);
            // Just finished recording, look for newest session after a small delay
            const detectSession = async () => {
                await new Promise(r => setTimeout(r, 1000));
                try {
                    const res = await fetch('/api/teleop/sessions');
                    const sessions = await res.json();

                    // Be more lenient: if it's an array and has items, use it.
                    if (Array.isArray(sessions) && sessions.length > 0) {
                        setReviewSessionId(sessions[0].id);
                    }
                } catch (e) {
                    console.error("Failed to detect latest record session:", e);
                } finally {
                    setDetecting(false);
                }
            };
            detectSession();
        }
        wasRecording.current = status.recording;
    }, [status.recording]);

    const getApiUrl = useCallback((path: string) => {
        return `${TELEGRIP_HTTP_URL.replace(/\/$/, '')}${path}`;
    }, []);

    const getWsUrl = useCallback(() => {
        return TELEGRIP_WS_URL;
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/api/status'));
            const data = await res.json();
            if (data) {
                setStatus(prev => ({
                    ...prev,
                    robotEngaged: data.robotEngaged
                }));
            }
        } catch (e) {
            console.error("Failed to fetch status:", e);
        }
    }, [getApiUrl]);

    const connectRobot = useCallback(() => {
        const action = status.robotEngaged ? 'disconnect' : 'connect';
        fetch(getApiUrl('/api/robot'), {
            method: 'POST',
            body: JSON.stringify({ action }),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus(prev => ({ ...prev, robotEngaged: action === 'connect' }));
                }
            })
            .catch(err => console.error("Robot connect error:", err));

    }, [status.robotEngaged, getApiUrl]);

    const handleStatusChange = useCallback((connected: boolean) => {
        setStatus(prev => ({ ...prev, connected }));
        if (connected) {
            fetchStatus();

            // Auto-connect if Quest 3 is detected
            const isQuest = /OculusBrowser|Quest 3|Quest 2/i.test(navigator.userAgent);
            if (isQuest) {
                console.log("Quest detected, auto-engaging digital twin...");
                // Small delay to ensure backend is ready
                setTimeout(() => {
                    // Only connect if not already engaged
                    setStatus(currentStatus => {
                        if (!currentStatus.robotEngaged) {
                            connectRobot();
                        }
                        return currentStatus;
                    });
                }, 1000);
            }
        }
    }, [fetchStatus, connectRobot]);

    const { connect, isConnected, sendControllerData, sendAction } = useTeleopClient({
        url: getWsUrl(),
        onRobotState: handleRobotState,
        onStatusChange: handleStatusChange
    });

    // Connect on mount
    useEffect(() => {
        connect();
    }, [connect]);

    const toggleRecording = useCallback(() => {
        sendAction('record_toggle');
    }, [sendAction]);

    return (
        <main className="fixed inset-0 h-screen h-[100dvh] bg-black overflow-hidden relative z-0">
            {detecting && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[200] bg-blue-600 text-white px-6 py-3 rounded-full font-bold animate-pulse shadow-2xl flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Recording...
                </div>
            )}

            {reviewSessionId && (
                <SessionReview
                    sessionId={reviewSessionId}
                    jobId={jobId}
                    onClose={() => setReviewSessionId(null)}
                />
            )}

            <TeleopControls
                isConnected={status.connected}
                isRecording={status.recording}
                robotEngaged={status.robotEngaged}
                connectRobot={connectRobot}
                toggleRecording={toggleRecording}
            />

            <div className="absolute inset-0 z-0">
                <VRScene
                    robotState={robotState}
                    sendControllerData={sendControllerData}
                    sendAction={sendAction}
                />
            </div>
        </main>
    );
}

export default function TeleopPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-[0.3em] opacity-20">Initializing Interface...</div>}>
            <TeleopContent />
        </Suspense>
    );
}
