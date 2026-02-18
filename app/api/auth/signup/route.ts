import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email, password, captchaToken } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify Captcha
        if (process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_CLOUD_PROJECT_ID) {
            const { createAssessment } = await import("@/lib/recaptcha");
            const score = await createAssessment({
                token: captchaToken,
                recaptchaAction: 'signup'
            });

            if (score === null || score < 0.5) {
                return NextResponse.json({ error: "Invalid captcha or low trust score" }, { status: 400 });
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                emailVerified: new Date(), // Auto-verify for Alpha
            },
        });

        // Email verification disabled for Alpha
        /*
        const token = uuidv4();
        const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        try {
            await sendVerificationEmail(email, token);
        } catch (error: any) {
            console.error("Failed to send email:", error);
            // Delete the user so they can try again once email is fixed
            await prisma.user.delete({ where: { id: user.id } });
            return NextResponse.json({ error: `Could not send verification email: ${error.message}` }, { status: 500 });
        }
        */

        return NextResponse.json({ message: "Account created successfully" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
