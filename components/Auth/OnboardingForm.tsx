'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, ArrowRight } from 'lucide-react';

export default function OnboardingForm() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<'teleoperator' | 'lab' | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: selectedRole,
                    displayName: selectedRole === 'teleoperator' ? displayName : undefined,
                    orgName: selectedRole === 'lab' ? orgName : undefined,
                }),
            });

            if (res.ok) {
                router.refresh(); // Refresh session to get new role
                router.push('/');
            } else {
                console.error('Onboarding failed');
                // Handle error state
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2 text-white text-center">Welcome to Motion Exchange</h1>
            <p className="text-slate-400 text-center mb-12">Select your primary role to get started.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <button
                    onClick={() => setSelectedRole('teleoperator')}
                    className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${selectedRole === 'teleoperator'
                            ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${selectedRole === 'teleoperator' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        }`}>
                        <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Teleoperator</h3>
                    <p className="text-slate-400 text-sm">
                        I want to control robots, submit datasets, and earn from my motion data.
                    </p>
                </button>

                <button
                    onClick={() => setSelectedRole('lab')}
                    className={`relative group p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${selectedRole === 'lab'
                            ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${selectedRole === 'lab' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        }`}>
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Lab / Customer</h3>
                    <p className="text-slate-400 text-sm">
                        I want to browse datasets, request specific motions, and purchase data.
                    </p>
                </button>
            </div>

            <div className={`overflow-hidden transition-all duration-500 ${selectedRole ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                        {selectedRole === 'teleoperator' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="e.g. RobotWizard99"
                                />
                            </div>
                        )}

                        {selectedRole === 'lab' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                    placeholder="e.g. Acme Robotics Lab"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${selectedRole === 'teleoperator'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20'
                                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20'
                                }`}
                        >
                            {isSubmitting ? 'Setting up...' : (
                                <>
                                    Complete Setup <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
