"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface TeleopClientProps {
    onRobotState: (state: any) => void;
    onStatusChange: (connected: boolean) => void;
    onRecordingStopped?: (sessionId: string, recordDir?: string) => void;
    url?: string;
}

import { EMBODEX_TELEOP_WS_URL } from '@/lib/config';

export function useTeleopClient({ onRobotState, onStatusChange, onRecordingStopped, url = EMBODEX_TELEOP_WS_URL }: TeleopClientProps) {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    const connect = useCallback(async () => {
        if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

        // 1. Request short-lived ticket from Next.js server route
        let ticket: string | null = null;
        let targetWsUrl = url;

        try {
            const ticketRes = await fetch('/api/teleop/ws-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (ticketRes.ok) {
                const ticketData = await ticketRes.json();
                if (ticketData.ticket) {
                    ticket = ticketData.ticket;
                }
                if (ticketData.wsUrl) {
                    targetWsUrl = ticketData.wsUrl;
                }
            } else {
                console.warn(`[TeleopClient] Ticket request returned status ${ticketRes.status}`);
            }
        } catch (e) {
            console.error('[TeleopClient] Failed to fetch WebSocket ticket:', e);
        }

        if (targetWsUrl.includes("localhost") || targetWsUrl.includes("127.0.0.1")) {
            const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            targetWsUrl = targetWsUrl.replace("localhost", host).replace("127.0.0.1", host);
        }

        console.log(`Connecting to Embodex teleop backend at ${targetWsUrl}...`);

        try {
            // 2. Connect using subprotocol authentication: embodex-ticket.<ticket>
            const protocols = ticket ? [`embodex-ticket.${ticket}`] : undefined;
            ws.current = protocols ? new WebSocket(targetWsUrl, protocols) : new WebSocket(targetWsUrl);

            ws.current.onopen = () => {
                console.log("Connected to Embodex teleop backend");
                setIsConnected(true);
                onStatusChange(true);
            };

            ws.current.onclose = (event) => {
                console.log(`Disconnected from Embodex teleop backend (code: ${event.code})`);
                setIsConnected(false);
                onStatusChange(false);
                ws.current = null;
            };

            ws.current.onerror = (err) => {
                console.error("WebSocket error:", err);
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
            ws.current = null;
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
