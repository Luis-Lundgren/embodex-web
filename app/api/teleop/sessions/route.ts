import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { proxyTeleopRequest } from '@/lib/teleop-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            // PRIORITY 2: Require authenticated NextAuth user to prevent unauthorized trajectory retrieval
            const session = await authService.getSession();
            if (!session?.user) {
                return NextResponse.json(
                    { error: 'Unauthorized: Authentication required to retrieve session trajectory data' },
                    { status: 401 }
                );
            }

            // Authorization check
            const user = session.user as { id?: string; roles?: string[] };
            const roles = user.roles || [];

            // TODO: Enforce fine-grained ownership linkage when data model links sessions to jobs:
            // - Teleoperator may access sessions they recorded / own
            // - Lab may access sessions belonging to a job they funded / requested
            // - Admin may access all sessions
            // Currently, any authenticated user with an established account is permitted.

            // 1. Fetch live session data from teleop backend (filesystem) via server-side proxy
            const { status, data: teleopData } = await proxyTeleopRequest(`/api/sessions/${sessionId}`);
            if (status === 200 && teleopData) {
                return NextResponse.json(teleopData);
            }

            // 2. Fallback to canonical marketplace DB
            const dataset = await prisma.dataset.findFirst({
                where: { sourceId: sessionId },
                include: { episodes: true },
            });

            if (dataset && dataset.episodes.length > 0 && dataset.episodes[0].data) {
                const episode = dataset.episodes[0];
                const responseData = {
                    ...(episode.data as object),
                    datasetId: dataset.id,
                    episodeId: episode.id,
                };
                return NextResponse.json(responseData);
            }

            return NextResponse.json({ error: 'No playable data found in session' }, { status: 404 });
        }

        // List sessions: teleop first (metadata summary only, sanitized of local paths), merge with DB entries
        const { status, data: teleopSessions } = await proxyTeleopRequest('/api/sessions');
        if (status === 200 && Array.isArray(teleopSessions) && teleopSessions.length > 0) {
            return NextResponse.json(teleopSessions);
        }

        const datasets = await prisma.dataset.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                sourceId: true,
                createdAt: true,
            },
        });

        const sessions = datasets.map((d: any) => ({
            id: d.sourceId,
            createdAt: d.createdAt,
            recording: false,
        }));

        return NextResponse.json(sessions);

    } catch (error) {
        console.error('[teleop/sessions] Error fetching sessions:', error);
        return NextResponse.json({ error: 'Failed to retrieve sessions' }, { status: 500 });
    }
}
