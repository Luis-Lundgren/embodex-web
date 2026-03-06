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
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { roles: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isTeleoperator = user.roles.some((r: any) => r.role === 'teleoperator');
        if (!isTeleoperator) {
            return NextResponse.json({ error: 'Only teleoperators can view earnings' }, { status: 403 });
        }

        // Fetch all ledger entries
        const ledgerEntries = await prisma.earningsLedger.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate balances
        let totalEarnedCents = 0;
        let availableBalanceCents = 0;
        let pendingPayoutsCents = 0;
        let paidOutCents = 0;

        for (const entry of ledgerEntries) {
            if (entry.type === 'credit') {
                totalEarnedCents += entry.amountCents;
                availableBalanceCents += entry.amountCents;
            } else if (entry.type === 'debit') {
                // Deduct from available balance
                availableBalanceCents -= entry.amountCents;
                if (entry.status === 'pending_payout') {
                    pendingPayoutsCents += entry.amountCents;
                } else if (entry.status === 'completed') {
                    paidOutCents += entry.amountCents;
                }
            }
        }

        // Fetch payout history (payments created by this user with type 'payout')
        const payouts = await prisma.payment.findMany({
            where: {
                userId: user.id,
                type: 'payout'
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            balances: {
                totalEarnedCents,
                availableBalanceCents,
                pendingPayoutsCents,
                paidOutCents
            },
            ledger: ledgerEntries,
            payouts
        });
    } catch (error) {
        console.error("Error fetching earnings:", error);
        return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
    }
}
