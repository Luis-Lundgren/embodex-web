import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const datasetId = params.id;
        const { searchParams } = new URL(request.url);
        const episodeId = searchParams.get('episode');

        // 1. Try fetching from Database first (for submissions)
        // If we have an episodeId and it looks like a UUID (or just check DB regardless)
        if (episodeId) {
            const dbEpisode = await prisma.episode.findUnique({
                where: { id: episodeId },
                select: { data: true }
            });

            if (dbEpisode && dbEpisode.data) {
                return NextResponse.json(dbEpisode.data);
            }
        }

        // 2. Fallback to Filesystem (for manifest datasets)
        const datasetsDir = path.join(process.cwd(), 'datasets');
        // Sanitize datasetId to prevent directory traversal
        const safeDatasetId = datasetId.replace(/[^a-zA-Z0-9_-]/g, '');
        const datasetDir = path.join(datasetsDir, safeDatasetId);

        try {
            await fs.access(datasetDir);
        } catch {
            // If directory doesn't exist, and we didn't find it in DB, return 404
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
        }

        // List files to find the requested one
        let targetFile = "";

        if (episodeId) {
            // Sanitize episodeId
            const safeEpisodeId = episodeId.replace(/[^a-zA-Z0-9_-]/g, '');
            targetFile = path.join(datasetDir, `${safeEpisodeId}.json`);

            // If the file doesn't exist, try adding .json if missing? 
            // The logic above assumed exact match or constructed path.
            // Let's verify file existence
            try {
                await fs.access(targetFile);
            } catch {
                // Try searching for it? Or just fail
                targetFile = "";
            }
        } else {
            // Find first json
            const files = await fs.readdir(datasetDir);
            const jsonFile = files.find(f => f.endsWith('.json') && f.startsWith('episode'));
            if (jsonFile) {
                targetFile = path.join(datasetDir, jsonFile);
            }
        }

        if (!targetFile) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        const data = await fs.readFile(targetFile, 'utf-8');
        return NextResponse.json(JSON.parse(data));

    } catch (error) {
        console.error("Error reading episode:", error);
        return NextResponse.json({ error: 'Failed to load episode data' }, { status: 500 });
    }
}
