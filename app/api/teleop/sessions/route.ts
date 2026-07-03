import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getTelegripBaseUrl(): string | null {
    const url = process.env.TELEGRIP_HTTP_URL || process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL;
    return url ? url.replace(/\/$/, '') : null;
}

async function fetchFromTelegrip(path: string) {
    const base = getTelegripBaseUrl();
    if (!base) return null;
    try {
        const res = await fetch(`${base}${path}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error(`Failed to fetch from telegrip ${path}:`, e);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            // Prefer live session data from telegrip backend (filesystem)
            const telegripData = await fetchFromTelegrip(`/api/sessions/${sessionId}`);
            if (telegripData) {
                return NextResponse.json(telegripData);
            }

            // Fallback to embodex DB
            const dataset = await prisma.dataset.findFirst({
                where: { sourceId: sessionId },
                include: { episodes: true }
            });

            if (dataset && dataset.episodes.length > 0 && dataset.episodes[0].data) {
                const episode = dataset.episodes[0];
                const responseData = {
                    ...(episode.data as object),
                    datasetId: dataset.id,
                    episodeId: episode.id
                };
                return NextResponse.json(responseData);
            }

            return NextResponse.json({ error: 'No playable data found in session' }, { status: 404 });
        }

        // List sessions: telegrip first, merge with DB entries
        const telegripSessions = await fetchFromTelegrip('/api/sessions');
        if (Array.isArray(telegripSessions) && telegripSessions.length > 0) {
            return NextResponse.json(telegripSessions);
        }

        const datasets = await prisma.dataset.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                sourceId: true,
                createdAt: true
            }
        });

        const sessions = datasets.map((d: any) => ({
            id: d.sourceId,
            createdAt: d.createdAt
        }));

        return NextResponse.json(sessions);

    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
