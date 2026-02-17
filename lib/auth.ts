import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile"
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                // Verify Captcha for Login
                if (process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_CLOUD_PROJECT_ID) {
                    const { createAssessment } = await import("./recaptcha");
                    const captchaToken = (credentials as any).captchaToken;
                    const score = await createAssessment({
                        token: captchaToken,
                        recaptchaAction: 'login'
                    });

                    if (score === null || score < 0.5) {
                        throw new Error("Invalid captcha or low trust score");
                    }
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                if (!user.emailVerified) {
                    throw new Error("Email not verified");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        })
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = user.id;

                // Fetch roles to include in session
                // @ts-ignore
                const userRoles = await prisma.userRole.findMany({
                    where: { userId: user.id },
                });

                // @ts-ignore
                session.user.roles = userRoles.map(r => r.role);
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        newUser: '/onboarding', // Redirect here after first login
    },
    session: {
        strategy: "database"
    }
};
