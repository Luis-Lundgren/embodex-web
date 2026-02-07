import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const RECORDS_DIR = path.join(process.cwd(), 'records');

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            // Serve specific session data
            // Look for lerobot_frames.parquet or converted json. 
            // For MVP simplicity, let's assume the recorder can spit out a json or we read a specific file.
            // Telegrip usually saves .parquet files. If we want to play it back in the browser,
            // we might need a meta file or a converted JSON.
            // Let's check what's actually in a test_session folder first.
            const sessionPath = path.join(RECORDS_DIR, sessionId);
            const files = await fs.readdir(sessionPath);

            // Filter out meta.json and find the latest teleop JSON
            const jsonFiles = await Promise.all(
                files
                    .filter((f: string) => f.endsWith('.json') && f !== 'meta.json')
                    .map(async (f: string) => {
                        const stats = await fs.stat(path.join(sessionPath, f));
                        return { name: f, mtime: stats.mtime };
                    })
            );

            jsonFiles.sort((a: any, b: any) => b.mtime.getTime() - a.mtime.getTime());

            if (jsonFiles.length > 0) {
                const data = await fs.readFile(path.join(sessionPath, jsonFiles[0].name), 'utf-8');
                return NextResponse.json(JSON.parse(data));
            }

            return NextResponse.json({ error: 'No playable data found in session' }, { status: 404 });
        }

        // List all sessions, sorted by date (newest first)
        const dirs = await fs.readdir(RECORDS_DIR, { withFileTypes: true });
        const sessions = await Promise.all(
            dirs
                .filter((d: any) => d.isDirectory())
                .map(async (d: any) => {
                    const stats = await fs.stat(path.join(RECORDS_DIR, d.name));
                    return {
                        id: d.name,
                        createdAt: stats.mtime,
                    };
                })
        );

        sessions.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json(sessions);

    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
