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
            },
        });

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
        } catch (error) {
            console.error("Failed to send email:", error);
            // We don't fail the request if email fails, but maybe strictly we should?
            // For now, let's just log it.
        }

        return NextResponse.json({ message: "User created. Please check your email." });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
