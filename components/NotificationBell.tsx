"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, XCircle, Info, Check } from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    link: string | null;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Optional: Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id?: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            });
            if (res.ok) {
                if (id) {
                    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                } else {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUBMISSION_APPROVED': return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'SUBMISSION_REJECTED': return <XCircle className="text-red-500" size={16} />;
            case 'EARNINGS_RECEIVED': return <CheckCircle2 className="text-amber-500 border-amber-500/50" size={16} />;
            case 'NEW_SUBMISSION': return <Info className="text-purple-500" size={16} />;
            default: return <Info className="text-blue-500" size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 flex items-center justify-center transition-colors relative"
            >
                <Bell size={16} className="text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[85vw] sm:w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAsRead()}
                                disabled={loading}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase flex items-center gap-1 disabled:opacity-50"
                            >
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`group relative flex gap-3 p-4 border-b border-slate-800/50 transition-colors hover:bg-slate-800/50 ${!notification.read ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm tracking-tight leading-snug ${!notification.read ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                                {notification.link ? (
                                                    <Link
                                                        href={notification.link}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className="hover:text-blue-400 transition-colors outline-none"
                                                    >
                                                        {notification.message}
                                                    </Link>
                                                ) : (
                                                    <span onClick={() => handleNotificationClick(notification)} className="cursor-pointer">
                                                        {notification.message}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-wider">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="shrink-0 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
