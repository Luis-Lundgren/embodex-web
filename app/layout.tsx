import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SO-100 Motion Exchange",
    description: "Premium Robot Dataset Marketplace",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <head>
                <script src="/trusted-types.js"></script>
            </head>
            <body className={`${inter.className} h-full overflow-hidden bg-slate-950 text-gray-200`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
