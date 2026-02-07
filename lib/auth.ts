import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

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
