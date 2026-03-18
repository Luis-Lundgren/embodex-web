import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, ClipboardList, Gamepad2, Award, Share2, Network, Users, Globe } from 'lucide-react';

export default async function LandingPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/explore");
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden font-sans">
            <LandingNav />

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-200px] left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute top-[100px] right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen"></div>
            </div>

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 md:px-8 pt-32 pb-24">
                {/* Hero Section */}
                <section className="w-full max-w-6xl mx-auto text-center flex flex-col items-center mt-12 mb-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium tracking-wide mb-8 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                        <Activity className="w-4 h-4" />
                        <span>The missing data layer for robot learning</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                        Teleoperation Data <br />
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 text-transparent bg-clip-text drop-shadow-sm">
                            On Demand
                        </span>
                    </h1>

                    <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-light tracking-wide leading-relaxed">
                        <strong className="text-white font-medium">Request high-quality teleoperation data on demand.</strong> The exchange where roboticists and teleoperators share the demonstrations that teach machines to move.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Link href="/explore" className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transform hover:-translate-y-1">
                            Browse Datasets
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/login" className="px-8 py-4 bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white font-medium rounded-full transition-all backdrop-blur-md">
                            Log In
                        </Link>
                    </div>
                </section>

                {/* Problem/Solution Section */}
                <section className="w-full max-w-5xl mx-auto mb-32">
                    <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                        <div className="absolute -right-32 -top-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                        
                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                    Robots can't learn without demonstrations. <br/>
                                    <span className="text-blue-400">Demonstrations don't scale.</span>
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                    LLMs had the internet. Robotics has nothing equivalent. Every <strong className="text-gray-200">lab</strong> collects its own teleoperation data, in isolation, using expensive hardware and in-person <strong className="text-gray-200">operators</strong>.
                                </p>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    The result: the best robot learning algorithms are starved of the data they need. Embodex changes the equation. A shared motion exchange where every dataset is available to every researcher. Collect once, train everywhere.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">Global Labs</h3>
                                    <p className="text-sm text-gray-500">Uniting researchers across the world.</p>
                                </div>
                                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center translate-y-6">
                                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">Remote Operators</h3>
                                    <p className="text-sm text-gray-500">Teleoperate from any browser.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="w-full max-w-6xl mx-auto mb-32 relative">
                    {/* Background glow for features */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">One platform. Every SO-100 dataset.</h2>
                        <p className="text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">The unified infrastructure connecting decentralized labs and teleoperators worldwide.</p>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: <ClipboardList className="w-6 h-6" />,
                                    title: "Request",
                                    desc: "Request specific sets of data for the Teleoperators to fulfill. Get exactly the motions your models need."
                                },
                                {
                                    icon: <Gamepad2 className="w-6 h-6" />,
                                    title: "Web Teleoperation",
                                    desc: "Empower global teleoperators to control an SO-100 from any browser. No leader arm required."
                                },
                                {
                                    icon: <Award className="w-6 h-6" />,
                                    title: "Quality Scoring",
                                    desc: "Every trajectory is automatically evaluated for smoothness, task completion, and consistency."
                                },
                                {
                                    icon: <Share2 className="w-6 h-6" />,
                                    title: "Data Exchange",
                                    desc: "Seamlessly share datasets across different labs. Trade demonstrations and build collective intelligence."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-300 rounded-3xl p-8 group flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] transition-all duration-300 group-hover:bg-blue-500/10"></div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all relative z-10">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3 relative z-10">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed flex-1 relative z-10">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full max-w-4xl mx-auto text-center">
                    <div className="relative p-10 md:p-16 overflow-hidden rounded-[40px] border border-blue-500/20 bg-blue-900/10 backdrop-blur-md">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.15)_0%,transparent_70%)] pointer-events-none"></div>
                        <h2 className="relative z-10 text-3xl md:text-5xl font-bold mb-6">The SO-100 ecosystem deserves a real data backbone.</h2>
                        <p className="relative z-10 text-lg md:text-xl text-blue-200/70 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                            Thousands of researchers build with the SO-100. Join the network of labs and operators where every robot arm learns from every demonstration ever recorded.
                        </p>
                        <Link href="/signup" className="relative z-10 inline-flex items-center gap-2 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transform hover:-translate-y-1">
                            Join the Network
                            <Network className="w-5 h-5 ml-2" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
