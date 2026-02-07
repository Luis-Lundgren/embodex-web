import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
    try {
        const manifestPath = path.join(process.cwd(), 'datasets', 'manifest.json');

        // Check if exists
        try {
            await fs.access(manifestPath);
        } catch {
            return NextResponse.json([]);
        }

        const data = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(data);

        return NextResponse.json(manifest);
    } catch (error) {
        console.error("Error reading manifest:", error);
        return NextResponse.json({ error: 'Failed to load datasets' }, { status: 500 });
    }
}
