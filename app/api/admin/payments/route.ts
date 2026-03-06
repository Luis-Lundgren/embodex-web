import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const role = url.searchParams.get('role');
        const type = url.searchParams.get('type');
        const status = url.searchParams.get('status');

        const whereClause: any = {};
        if (role) whereClause.role = role;
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                user: { select: { email: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, payments });
    } catch (error) {
        console.error("Error fetching administrative payments:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { paymentId, status } = body;

        if (!paymentId || !status) {
            return NextResponse.json({ error: 'Missing paymentId or status' }, { status: 400 });
        }

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: { status }
        });

        if (payment.type === 'payout' && status === 'paid') {
            // Find the corresponding ledger entry. We don't have a strict link, but we can find the most recent pending debit.
            const pendingDebit = await prisma.earningsLedger.findFirst({
                where: {
                    userId: payment.userId,
                    type: 'debit',
                    status: 'pending_payout',
                    amountCents: payment.amountCents
                },
                orderBy: { createdAt: 'desc' }
            });

            if (pendingDebit) {
                await prisma.earningsLedger.update({
                    where: { id: pendingDebit.id },
                    data: { status: 'completed' }
                });
            }
        }

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        console.error("Error updating payment status:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
