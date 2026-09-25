import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { proxyTeleopRequest } from '@/lib/teleop-service';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTIONS = ['robot', 'keyboard', 'keypress', 'task', 'restart', 'config', 'status'] as const;
type ActionType = typeof ALLOWED_ACTIONS[number];

function validateRole(action: ActionType, method: string, roles: string[]): { allowed: boolean; reason?: string } {
    const isAdmin = roles.includes('admin');
    const isTeleoperator = roles.includes('teleoperator');

    // 1. Admin-only operations
    if (action === 'restart') {
        if (!isAdmin) {
            return { allowed: false, reason: 'Forbidden: Restarting teleop service requires admin role' };
        }
        return { allowed: true };
    }

    if (action === 'config' && method === 'POST') {
        if (!isAdmin) {
            return { allowed: false, reason: 'Forbidden: Modifying hardware configuration requires admin role' };
        }
        return { allowed: true };
    }

    // 2. Teleoperator or Admin operations (Hardware/Robot physical control)
    if (['robot', 'keyboard', 'keypress', 'task'].includes(action)) {
        if (!isTeleoperator && !isAdmin) {
            return { allowed: false, reason: `Forbidden: Control action '${action}' requires teleoperator or admin role` };
        }
        return { allowed: true };
    }

    // 3. Status and Read-Only Config
    if (action === 'status' || (action === 'config' && method === 'GET')) {
        return { allowed: true };
    }

    return { allowed: true };
}

export async function GET(
    request: Request,
    { params }: { params: { action: string } }
) {
    const action = params.action as ActionType;
    if (!ALLOWED_ACTIONS.includes(action)) {
        return NextResponse.json({ error: `Not found: Unknown action '${params.action}'` }, { status: 404 });
    }

    const session = await authService.getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const roles: string[] = (session.user as any)?.roles || [];
    const check = validateRole(action, 'GET', roles);
    if (!check.allowed) {
        return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    const { status, data } = await proxyTeleopRequest(`/api/${action}`, { method: 'GET' });
    return NextResponse.json(data, { status });
}

export async function POST(
    request: Request,
    { params }: { params: { action: string } }
) {
    const action = params.action as ActionType;
    if (!ALLOWED_ACTIONS.includes(action)) {
        return NextResponse.json({ error: `Not found: Unknown action '${params.action}'` }, { status: 404 });
    }

    const session = await authService.getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const roles: string[] = (session.user as any)?.roles || [];
    const check = validateRole(action, 'POST', roles);
    if (!check.allowed) {
        return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    let body: any = undefined;
    try {
        const text = await request.text();
        if (text && text.trim()) {
            body = JSON.parse(text);
        }
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { status, data } = await proxyTeleopRequest(`/api/${action}`, {
        method: 'POST',
        body,
    });

    return NextResponse.json(data, { status });
}
