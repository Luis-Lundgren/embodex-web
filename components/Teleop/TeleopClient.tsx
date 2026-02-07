"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface TeleopClientProps {
    onRobotState: (state: any) => void;
    onStatusChange: (connected: boolean) => void;
    url?: string;
}

export function useTeleopClient({ onRobotState, onStatusChange, url = "wss://localhost:8442" }: TeleopClientProps) {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        let targetUrl = url;
        if (targetUrl.includes("localhost")) {
            targetUrl = targetUrl.replace("localhost", window.location.hostname);
        } else if (targetUrl.includes("127.0.0.1")) {
            targetUrl = targetUrl.replace("127.0.0.1", window.location.hostname);
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
                    }
                } catch (e) {
                    console.error("Error parsing message:", e);
                }
            };
        } catch (e) {
            console.error("Failed to create WebSocket:", e);
        }
    }, [url, onRobotState, onStatusChange]);

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
