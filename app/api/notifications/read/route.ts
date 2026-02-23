import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { notificationId } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (notificationId) {
            // Mark specific notification as read
            await prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId: user.id
                },
                data: { read: true }
            });
        } else {
            // Mark all notifications as read for this user
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    read: false
                },
                data: { read: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
