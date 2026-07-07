"use client";

import dynamic from "next/dynamic";
import { useTeleopClient } from "@/components/Teleop/TeleopClient";
import { TeleopControls } from "@/components/Teleop/Controls";
import SessionReview from "@/components/Teleop/SessionReview";
import { TELEGRIP_WS_URL, TELEGRIP_HTTP_URL } from "@/lib/config";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Three.js / WebXR is ~650 KB — load after the shell hydrates so the page
// does not stay stuck on the Suspense fallback while this chunk downloads.
const VRScene = dynamic(
    () => import("@/components/Teleop/VRScene").then((m) => m.VRScene),
    {
        ssr: false,
        loading: () => (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
                <p className="font-mono text-xs uppercase tracking-widest text-white/30">
                    Loading 3D scene...
                </p>
            </div>
        ),
    }
);

export default function TeleopContent() {
    const { status: authStatus } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");

    const [robotState, setRobotState] = useState<any>(null);
    const [status, setStatus] = useState({
        connected: false,
        robotEngaged: false,
        recording: false,
    });

    const [detecting, setDetecting] = useState(false);

    const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
    const wasRecording = useRef(false);
    const activeSessionId = useRef<string | null>(null);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [authStatus, router]);

    const getApiUrl = useCallback((path: string) => {
        return `${TELEGRIP_HTTP_URL.replace(/\/$/, "")}${path}`;
    }, []);

    const handleRobotState = useCallback((state: any) => {
        setRobotState(state);
        if (state) {
            if (state.session_id) {
                activeSessionId.current = state.session_id;
            }
            setStatus((prev) => ({
                ...prev,
                recording: state.recording,
            }));
        }
    }, []);

    const handleRecordingStopped = useCallback((sessionId: string) => {
        activeSessionId.current = sessionId;
        setReviewSessionId(sessionId);
        setDetecting(false);
    }, []);

    useEffect(() => {
        if (wasRecording.current && !status.recording) {
            const knownSessionId = activeSessionId.current;
            if (knownSessionId) {
                setReviewSessionId(knownSessionId);
                return;
            }

            setDetecting(true);
            const detectSession = async () => {
                for (let attempt = 0; attempt < 5; attempt++) {
                    await new Promise((r) => setTimeout(r, 1000));
                    try {
                        const res = await fetch(getApiUrl("/api/sessions"));
                        if (!res.ok) continue;
                        const sessions = await res.json();
                        if (Array.isArray(sessions) && sessions.length > 0) {
                            setReviewSessionId(sessions[0].id);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to detect latest record session:", e);
                    }
                }
                setDetecting(false);
            };
            detectSession();
        }
        wasRecording.current = status.recording;
    }, [status.recording, getApiUrl]);

    const getWsUrl = useCallback(() => TELEGRIP_WS_URL, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl("/api/status"));
            const data = await res.json();
            if (data) {
                setStatus((prev) => ({
                    ...prev,
                    robotEngaged: data.robotEngaged,
                }));
            }
        } catch (e) {
            console.error("Failed to fetch status:", e);
        }
    }, [getApiUrl]);

    const connectRobot = useCallback(() => {
        const action = status.robotEngaged ? "disconnect" : "connect";
        fetch(getApiUrl("/api/robot"), {
            method: "POST",
            body: JSON.stringify({ action }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStatus((prev) => ({ ...prev, robotEngaged: action === "connect" }));
                }
            })
            .catch((err) => console.error("Robot connect error:", err));
    }, [status.robotEngaged, getApiUrl]);

    const handleStatusChange = useCallback(
        (connected: boolean) => {
            setStatus((prev) => ({ ...prev, connected }));
            if (connected) {
                fetchStatus();

                const isQuest = /OculusBrowser|Quest 3|Quest 2/i.test(navigator.userAgent);
                if (isQuest) {
                    setTimeout(() => {
                        setStatus((currentStatus) => {
                            if (!currentStatus.robotEngaged) {
                                connectRobot();
                            }
                            return currentStatus;
                        });
                    }, 1000);
                }
            }
        },
        [fetchStatus, connectRobot]
    );

    const { connect, sendControllerData, sendAction } = useTeleopClient({
        url: getWsUrl(),
        onRobotState: handleRobotState,
        onStatusChange: handleStatusChange,
        onRecordingStopped: handleRecordingStopped,
    });

    useEffect(() => {
        connect();
    }, [connect]);

    const toggleRecording = useCallback(() => {
        sendAction("record_toggle");
    }, [sendAction]);

    const resetTask = useCallback(() => {
        sendAction("task_reset");
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
                sessionId={robotState?.session_id}
                task={robotState?.task}
                connectRobot={connectRobot}
                toggleRecording={toggleRecording}
                resetTask={resetTask}
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
