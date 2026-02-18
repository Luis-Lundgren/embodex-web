import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const datasetId = params.id;
        // For MVP, just loading the first episode found in the manifest logic
        // Or better, check if an episode ID is passed in query string?
        // Let's assume we load the first episode for now or accept ?episode=...

        const { searchParams } = new URL(request.url);
        const episodeId = searchParams.get('episode');

        const datasetsDir = path.join(process.cwd(), 'datasets');
        const datasetDir = path.join(datasetsDir, datasetId);

        // List files to find the requested one
        let targetFile = "";

        if (episodeId) {
            targetFile = path.join(datasetDir, `${episodeId}.json`);
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
