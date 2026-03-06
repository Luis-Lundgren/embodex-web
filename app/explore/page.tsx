import { promises as fs } from 'fs';
import path from 'path';
import GalleryViewer from '@/components/GalleryViewer';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Helper to fetch datasets server-side
async function getDatasets() {
    const manifestPath = path.join(process.cwd(), 'datasets', 'manifest.json');
    try {
        const data = await fs.readFile(manifestPath, 'utf8');
        const datasets = JSON.parse(data);
        // Sort premium at the top
        return datasets.sort((a: any, b: any) => {
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;
            return 0;
        });
    } catch {
        return [];
    }
}

export default async function ExplorePage() {
    const session = await getServerSession(authOptions);

    // Redirect to onboarding if logged in but no roles selected
    if (session?.user) {
        // @ts-ignore
        const roles = session.user.roles || [];
        if (roles.length === 0) {
            redirect('/onboarding');
        }
    }

    const datasets = await getDatasets();

    return (
        <main className="h-screen w-screen overflow-hidden bg-slate-950">
            <GalleryViewer datasets={datasets} />
        </main>
    );
}
