"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface TeleopClientProps {
    onRobotState: (state: any) => void;
    onStatusChange: (connected: boolean) => void;
    onRecordingStopped?: (sessionId: string, recordDir?: string) => void;
    url?: string;
}

import { TELEGRIP_WS_URL } from '@/lib/config';

export function useTeleopClient({ onRobotState, onStatusChange, onRecordingStopped, url = TELEGRIP_WS_URL }: TeleopClientProps) {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        let targetUrl = url;
        if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
            const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            targetUrl = targetUrl.replace("localhost", host).replace("127.0.0.1", host);
        }

        console.log(`Connecting to TeleGrip backend at ${targetUrl}...`);

        try {
            ws.current = new WebSocket(targetUrl);

            ws.current.onopen = () => {
                console.log("Connected to TeleGrip backend");
                setIsConnected(true);
                onStatusChange(true);
            };

            ws.current.onclose = () => {
                console.log("Disconnected from TeleGrip backend");
                setIsConnected(false);
                onStatusChange(false);
                ws.current = null;
            };

            ws.current.onerror = (err) => {
                console.error("WebSocket error:", err);
                // Dont set connected false here, onclose will handle it
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'robot_state') {
                        onRobotState(data);
                        setLastMessageTime(Date.now());
                    } else if (data.type === 'recording_stopped' && data.session_id) {
                        onRecordingStopped?.(data.session_id, data.record_dir);
                    }
                } catch (e) {
                    console.error("Error parsing message:", e);
                }
            };
        } catch (e) {
            console.error("Failed to create WebSocket:", e);
        }
    }, [url, onRobotState, onStatusChange, onRecordingStopped]);

    const disconnect = useCallback(() => {
        if (ws.current) {
            ws.current.close();
        }
    }, []);

    const sendControllerData = useCallback((data: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        }
    }, []);

    const sendAction = useCallback((action: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ action }));
        }
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { connect, disconnect, isConnected, sendControllerData, sendAction };
}
