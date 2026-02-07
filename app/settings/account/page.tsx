import RoleManager from "@/components/Settings/RoleManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect('/login');
    }

    // Fetch user with fresh roles
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            roles: true,
            teleoperatorProfile: true,
            labProfile: true
        }
    });

    if (!user) return null;

    const currentRoles = (user.roles as { role: string }[]).map(r => r.role);

    return (
        <main className="min-h-screen bg-slate-950 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Exchange
                </Link>

                <header className="mb-10 flex items-center gap-6">
                    {user.image && (
                        <div className="w-20 h-20 rounded-full border-2 border-blue-600/30 overflow-hidden shadow-2xl shadow-blue-500/20 shrink-0">
                            <img src={user.image} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 tracking-tight">
                            Account Settings
                        </h1>
                        <p className="text-slate-400 mt-1 font-medium">{user.email}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Role Management */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <RoleManager currentRoles={currentRoles} />
                        </section>

                        {/* Profile Info based on roles */}
                        {user.teleoperatorProfile && (
                            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                                    Teleoperator Profile
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-500 block mb-1">Display Name</label>
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                                            {user.teleoperatorProfile.displayName}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-500 block mb-1">Bio</label>
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 min-h-[80px]">
                                            {user.teleoperatorProfile.bio || "No bio yet."}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {user.labProfile && (
                            <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                                    Lab Profile
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-500 block mb-1">Organization Name</label>
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                                            {user.labProfile.orgName}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
