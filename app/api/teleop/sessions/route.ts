import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    /*
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            // Fetch specific session data from DB
            const dataset = await prisma.dataset.findFirst({
                where: { sourceId: sessionId },
                include: { episodes: true }
            });

            if (dataset && dataset.episodes.length > 0 && dataset.episodes[0].data) {
                // Return the 'data' field which contains the full JSON
                // Inject the DB IDs so the frontend knows it's already persisted
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

        // List all sessions (datasets)
        const datasets = await prisma.dataset.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                sourceId: true,
                createdAt: true
            }
        });

        // Map to format expected by frontend { id: string, createdAt: Date }
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
