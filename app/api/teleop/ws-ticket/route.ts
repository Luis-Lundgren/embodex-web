import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { createWsTicket, getTeleopWsUrl, getWsTicketSecret } from '@/lib/teleop-service';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const session = await authService.getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized: Authentication required to obtain teleoperation ticket' },
                { status: 401 }
            );
        }

        const user = session.user as { id?: string; roles?: string[] };
        const userId = user.id;
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing user identifier in session' },
                { status: 401 }
            );
        }

        const roles: string[] = user.roles || [];

        // Role restriction: Labs alone cannot obtain direct physical teleop tickets
        if (roles.length > 0 && !roles.includes('teleoperator') && !roles.includes('admin')) {
            return NextResponse.json(
                { error: 'Forbidden: Teleoperation access requires teleoperator or admin role' },
                { status: 403 }
            );
        }

        if (!getWsTicketSecret()) {
            console.error('[ws-ticket] EMBODEX_WS_TICKET_SECRET is not configured on the web server');
            return NextResponse.json(
                { error: 'Server misconfiguration: WebSocket ticketing secret not configured' },
                { status: 500 }
            );
        }

        const expiresIn = 60; // 60 seconds TTL
        const ticket = createWsTicket({ id: userId, roles }, expiresIn);
        const wsUrl = getTeleopWsUrl();

        return NextResponse.json({
            ticket,
            wsUrl,
            expiresIn,
        });
    } catch (error: any) {
        console.error('[ws-ticket] Failed to issue ticket:', error);
        return NextResponse.json(
            { error: 'Failed to issue teleop ticket' },
            { status: 500 }
        );
    }
}
