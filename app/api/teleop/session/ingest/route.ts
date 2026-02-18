import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            robot,
            session_id,
            episode_id,
            fps,
            timestamps,
            joint_positions,
            metadata,
            jobId
        } = body;

        // Basic validation
        if (!joint_positions || !timestamps) {
            return NextResponse.json({ error: 'Missing trajectory data' }, { status: 400 });
        }

        const duration = metadata?.duration || (timestamps[timestamps.length - 1] - timestamps[0]) || 0;
        const frameCount = metadata?.frame_count || joint_positions.length;

        // Find or create Dataset for this session_id
        // Usually session_id comes from TeleGrip backend
        let dataset = await prisma.dataset.findFirst({
            where: { sourceId: session_id || 'manual_upload' }
        });

        if (!dataset) {
            dataset = await prisma.dataset.create({
                data: {
                    title: `Teleop Session: ${session_id || 'New'}`,
                    description: `Recorded trajectory using ${robot || 'unknown'} robot.`,
                    sourceType: 'teleop',
                    sourceId: session_id || 'manual_upload',
                    status: 'COMPLETED',
                    ownerId: (session.user as any).id
                } as any
            });
        }

        // Create Episode with JSON data
        const episode = await prisma.episode.create({
            data: {
                datasetId: dataset.id,
                data: body as any,
                duration: duration,
                frameCount: frameCount,
            } as any
        });

        // If this was linked to a job, update the job status
        if (jobId) {
            await prisma.request.update({
                where: { id: jobId },
                data: { status: 'in_review' }
            }).catch(e => console.error("Failed to update jobId status:", e));
        }

        return NextResponse.json({
            success: true,
            datasetId: dataset.id,
            episodeId: episode.id
        });

    } catch (error) {
        console.error("Error ingesting session:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
