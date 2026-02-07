import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, displayName, orgName } = await req.json();

    if (!role || !['teleoperator', 'lab'].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { roles: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const hasRole = user.roles.some(r => r.role === role);
        if (hasRole) {
            return NextResponse.json({ message: "Role already exists" });
        }

        // Add role
        await prisma.userRole.create({
            data: {
                userId: user.id,
                role: role
            }
        });

        // Create profile if missing
        if (role === 'teleoperator') {
            const profile = await prisma.teleoperatorProfile.findUnique({ where: { userId: user.id } });
            if (!profile) {
                await prisma.teleoperatorProfile.create({
                    data: {
                        userId: user.id,
                        displayName: displayName || user.name || "Anonymous"
                    }
                });
            }
        } else if (role === 'lab') {
            const profile = await prisma.labProfile.findUnique({ where: { userId: user.id } });
            if (!profile) {
                await prisma.labProfile.create({
                    data: {
                        userId: user.id,
                        orgName: orgName || "My Organization"
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !['teleoperator', 'lab'].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        await prisma.userRole.deleteMany({
            where: {
                userId: user.id,
                role: role
            }
        });

        // Note: we generally keep the profile even if role is removed, or we could delete it.
        // For MVP, keeping profile data is safer.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
    }
}
