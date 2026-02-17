import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        if (verificationToken.expires < new Date()) {
            return NextResponse.json({ error: "Token expired" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({ message: "Email verified" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
