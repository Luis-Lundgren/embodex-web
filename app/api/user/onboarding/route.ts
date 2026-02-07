import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { role, displayName, orgName } = data;

    if (!role || !['teleoperator', 'lab'].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create UserRole
        await prisma.userRole.create({
            data: {
                userId: user.id,
                role: role,
            },
        });

        // Create Profile based on role
        if (role === 'teleoperator') {
            await prisma.teleoperatorProfile.create({
                data: {
                    userId: user.id,
                    displayName: displayName || user.name || "Anonymous",
                }
            });
        } else if (role === 'lab') {
            await prisma.labProfile.create({
                data: {
                    userId: user.id,
                    orgName: orgName || "My Organization",
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
