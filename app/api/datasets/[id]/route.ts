import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const datasetId = params.id;
        const manifestPath = path.join(process.cwd(), 'datasets', 'manifest.json');

        const data = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(data);
        const dataset = manifest.find((d: any) => d.id === datasetId);

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
        }

        return NextResponse.json(dataset);
    } catch (error) {
        console.error("Error reading dataset metadata:", error);
        return NextResponse.json({ error: 'Failed to load dataset metadata' }, { status: 500 });
    }
}
