import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { amountCents, method } = body;

        if (!amountCents || amountCents <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { roles: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isTeleoperator = user.roles.some((r: any) => r.role === 'teleoperator');
        if (!isTeleoperator) {
            return NextResponse.json({ error: 'Only teleoperators can request payouts' }, { status: 403 });
        }

        // Calculate available balance
        const ledgerEntries = await prisma.earningsLedger.findMany({
            where: { userId: user.id }
        });

        let availableBalanceCents = 0;
        for (const entry of ledgerEntries) {
            if (entry.type === 'credit') {
                availableBalanceCents += entry.amountCents;
            } else if (entry.type === 'debit') {
                availableBalanceCents -= entry.amountCents;
            }
        }

        if (amountCents > availableBalanceCents) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        // Create transaction ID
        const transactionId = 'mock_po_' + crypto.randomBytes(8).toString('hex');

        // Execute transaction (Payment + Ledger Debit)
        const [payment, ledgerEntry] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    userId: user.id,
                    role: 'teleoperator',
                    type: 'payout',
                    amountCents,
                    currency: 'USD',
                    status: 'processing',
                    method: method || 'mock_bank',
                    transactionId,
                }
            }),
            prisma.earningsLedger.create({
                data: {
                    userId: user.id,
                    amountCents,
                    type: 'debit',
                    status: 'pending_payout',
                    description: 'Payout requested',
                }
            })
        ]);

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        console.error("Error processing payout:", error);
        return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
    }
}
