import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('lab')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { status, feedback } = body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Update Request
        const updatedRequest = await prisma.request.update({
            where: { id: params.id },
            data: {
                status: status,
                // We could store feedback in payload if needed, keeping it simple for now
            }
        });

        // Find associated Dataset and update its status too
        // The payload usually contains the sessionId which matches Dataset.sourceId
        let datasetUpdated = false;
        try {
            const payload = JSON.parse(updatedRequest.payload);
            if (payload.sessionId) {
                await prisma.dataset.updateMany({
                    where: { sourceId: payload.sessionId },
                    data: { status: status }
                });
                datasetUpdated = true;
            }
        } catch (e) {
            console.error("Failed to parse payload or update dataset status", e);
        }

        return NextResponse.json({
            success: true,
            request: updatedRequest,
            datasetUpdated
        });

    } catch (error) {
        console.error("Error updating review status:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
