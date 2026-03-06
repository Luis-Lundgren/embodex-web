import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/explore");
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
            <LandingNav />

            {/* Background elements to mimic Mixamo */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px]"></div>
            </div>

            {/* Dark vignette effect */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80 pointer-events-none"></div>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center mt-12">
                <p className="text-gray-400 font-medium tracking-[0.2em] uppercase text-sm mb-6">Embodex</p>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
                    Teleoperation Data On Demand
                </h1>

                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 font-light tracking-wide">
                    Browse, replay, and teleoperate robot motion datasets for the SO-100.
                </p>

                <div className="flex items-center gap-6">
                    <Link href="/explore" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-all shadow-lg shadow-blue-500/25">
                        Explore
                    </Link>
                    <Link href="/login" className="px-8 py-3 bg-transparent border border-gray-500 hover:border-white text-white font-medium rounded-full transition-all">
                        Log In
                    </Link>
                </div>
            </main>
        </div>
    );
}
