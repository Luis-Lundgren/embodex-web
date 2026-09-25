import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getTeleopBaseUrl(): string | null {
    // Preferred modern variables
    const url = process.env.EMBODEX_TELEOP_HTTP_URL ||
                process.env.NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL ||
                // Deprecated fallbacks (planned removal in a future release)
                process.env.TELEGRIP_HTTP_URL ||
                process.env.NEXT_PUBLIC_TELEGRIP_HTTP_URL;
    return url ? url.replace(/\/$/, '') : null;
}

async function fetchFromTeleop(path: string) {
    const base = getTeleopBaseUrl();
    if (!base) return null;
    try {
        const token = process.env.EMBODEX_API_TOKEN;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${base}${path}`, {
            cache: 'no-store',
            headers,
        });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error(`Failed to fetch from teleop service ${path}:`, e);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            // Prefer live session data from teleop backend (filesystem)
            const teleopData = await fetchFromTeleop(`/api/sessions/${sessionId}`);
            if (teleopData) {
                return NextResponse.json(teleopData);
            }

            // Fallback to canonical marketplace DB
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

        // List sessions: teleop first, merge with DB entries
        const teleopSessions = await fetchFromTeleop('/api/sessions');
        if (Array.isArray(teleopSessions) && teleopSessions.length > 0) {
            return NextResponse.json(teleopSessions);
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
