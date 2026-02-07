"use client";
import React, { useEffect, useState } from 'react';

export default function AdminPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/requests')
            .then(res => res.json())
            .then(data => {
                setRequests(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="glass-panel overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-gray-400 border-b border-white/10">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-mono text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${r.type === 'submit' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                        {r.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">{r.email}</td>
                                <td className="p-4">
                                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">{r.status}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
                                    {r.payload ? (() => {
                                        try {
                                            return JSON.parse(r.payload).details;
                                        } catch { return '-'; }
                                    })() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
