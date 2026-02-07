'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, Plus, Trash2 } from 'lucide-react';

interface RoleManagerProps {
    currentRoles: string[];
}

export default function RoleManager({ currentRoles }: RoleManagerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const hasTeleop = currentRoles.includes('teleoperator');
    const hasLab = currentRoles.includes('lab');

    const handleUpdateRole = async (action: 'add' | 'remove', role: 'teleoperator' | 'lab') => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/roles', {
                method: action === 'add' ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });

            if (res.ok) {
                router.refresh();
                setShowAdd(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex justify-between items-center">
                Your Roles
                {!loading && (!hasTeleop || !hasLab) && (
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Add Role
                    </button>
                )}
            </h2>

            <div className="space-y-4">
                {hasTeleop && (
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Teleoperator</h3>
                                <p className="text-sm text-slate-400">Contributor</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpdateRole('remove', 'teleoperator')}
                            disabled={loading || (hasTeleop && !hasLab)} // Prevent removing last role
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title={hasTeleop && !hasLab ? "Cannot remove last role" : "Remove role"}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                {hasLab && (
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Lab / Customer</h3>
                                <p className="text-sm text-slate-400">Buyer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpdateRole('remove', 'lab')}
                            disabled={loading || (!hasTeleop && hasLab)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title={!hasTeleop && hasLab ? "Cannot remove last role" : "Remove role"}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}
            </div>

            {showAdd && (
                <div className="mt-6 pt-6 border-t border-slate-800 animate-in slide-in-from-top-2 fade-in">
                    <h3 className="text-sm font-medium text-slate-400 mb-4">Select role to add:</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {!hasTeleop && (
                            <button
                                onClick={() => handleUpdateRole('add', 'teleoperator')}
                                disabled={loading}
                                className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all text-left"
                            >
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700">
                                    <User size={20} className="text-blue-500" />
                                </div>
                                <span className="font-medium">Teleoperator</span>
                            </button>
                        )}
                        {!hasLab && (
                            <button
                                onClick={() => handleUpdateRole('add', 'lab')}
                                disabled={loading}
                                className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 hover:border-purple-500 hover:bg-slate-800 transition-all text-left"
                            >
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700">
                                    <Building2 size={20} className="text-purple-500" />
                                </div>
                                <span className="font-medium">Lab / Customer</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
