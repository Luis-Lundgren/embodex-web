"use client";

import { useTeleopClient } from "@/components/Teleop/TeleopClient";
import { VRScene } from "@/components/Teleop/VRScene";
import { TeleopControls } from "@/components/Teleop/Controls";
import SessionReview from "@/components/Teleop/SessionReview";
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

    const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
    const wasRecording = useRef(false);

    // Check roles and redirect if needed
    useEffect(() => {
        if (authStatus === 'authenticated' && session?.user) {
            // @ts-ignore
            const roles = session.user.roles || [];
            if (roles.length === 0) {
                router.push('/onboarding');
            }
        }
    }, [authStatus, session, router]);

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
            // Just finished recording, look for newest session after a small delay
            const detectSession = async () => {
                await new Promise(r => setTimeout(r, 1000));
                try {
                    const res = await fetch('/api/teleop/sessions');
                    const sessions = await res.json();
                    if (sessions && sessions.length > 0) {
                        setReviewSessionId(sessions[0].id);
                    }
                } catch (e) {
                    console.error("Failed to detect latest record session");
                }
            };
            detectSession();
        }
        wasRecording.current = status.recording;
    }, [status.recording]);

    const getApiUrl = useCallback((path: string) => {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (base) {
            const url = base.startsWith('http') ? base : `https://${base}`;
            return `${url.replace(/\/$/, '')}${path}`;
        }
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return `https://${host}:8443${path}`;
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
        <main className="w-full h-screen bg-black overflow-hidden relative">
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
