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

        // @ts-ignore
        const userRoles = session.user.roles || [];

        const body = await req.json();
        const { type, email, payload } = body;

        // Basic validation
        if (!type) {
            return NextResponse.json({ error: 'Missing type' }, { status: 400 });
        }

        // Role Gating
        if (type === 'submission') {
            if (!userRoles.includes('teleoperator')) {
                return NextResponse.json({ error: 'Teleoperator role required' }, { status: 403 });
            }
        } else if (type === 'request') {
            if (!userRoles.includes('lab')) {
                return NextResponse.json({ error: 'Lab role required' }, { status: 403 });
            }
        }

        const request = await prisma.request.create({
            data: {
                type, // "submission" or "request"
                email: session.user.email!, // Use session email
                status: 'open',
                payload: JSON.stringify(payload || {})
            },
        });

        // If this is a submission answering a job, update the original job status
        if (type === 'submission' && payload?.jobId) {
            try {
                const originalJob = await prisma.request.update({
                    where: { id: payload.jobId },
                    data: { status: 'in_review' }
                });

                // Find the lab user who created the original job
                const labUser = await prisma.user.findUnique({
                    where: { email: originalJob.email }
                });

                if (labUser) {
                    const sessionName = payload.title || payload.sessionId || 'Unknown Session';
                    await prisma.notification.create({
                        data: {
                            userId: labUser.id,
                            type: 'NEW_SUBMISSION',
                            message: `A teleoperator submitted a trajectory for your job "${sessionName}".`,
                            link: `/review/${request.id}`
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to update parent job status or send lab notification:", e);
            }
        }

        return NextResponse.json(request);
    } catch (error) {
        console.error("Error creating request:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function GET() {
    // Admin only check should be here
    const requests = await prisma.request.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
}
