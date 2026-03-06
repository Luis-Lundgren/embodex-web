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
        const { amountCents, currency, method, referenceType, referenceId, type } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { roles: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isLab = user.roles.some((r: any) => r.role === 'lab');
        if (!isLab) {
            return NextResponse.json({ error: 'Only labs can make purchases' }, { status: 403 });
        }

        // Generate a random transaction ID
        const transactionId = 'mock_tx_' + crypto.randomBytes(8).toString('hex');

        // Create the payment record
        const payment = await prisma.payment.create({
            data: {
                userId: user.id,
                role: 'lab',
                type: type || 'purchase', // purchase or request_funding
                amountCents,
                currency: currency || 'USD',
                status: 'succeeded',
                method: method || 'mock_card',
                referenceType,
                referenceId,
                transactionId,
            }
        });

        // Credit the teleoperator if applicable
        if (referenceType === 'dataset' && referenceId) {
            const dataset = await prisma.dataset.findUnique({ where: { id: referenceId } });
            if (dataset && dataset.ownerId) {
                await prisma.earningsLedger.create({
                    data: {
                        userId: dataset.ownerId,
                        amountCents: amountCents, // Give them 100% for the mock
                        type: 'credit',
                        description: `Earnings from dataset purchase: ${dataset.title}`,
                        referenceType: 'dataset',
                        referenceId: dataset.id
                    }
                });
            }
        }

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        console.error("Error processing mock payment:", error);
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }
}
