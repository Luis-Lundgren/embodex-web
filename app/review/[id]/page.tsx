import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReviewInterface from "./ReviewInterface";

export const dynamic = 'force-dynamic';

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // @ts-ignore
    if (!session.user?.roles?.includes('lab')) {
        redirect('/');
    }

    // Fetch the specific request
    const request = await prisma.request.findUnique({
        where: { id: params.id }
    });

    if (!request) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                Review request not found
            </div>
        );
    }

    const payload = JSON.parse(request.payload);
    const sessionId = payload.sessionId;

    if (!sessionId) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                Invalid submission data: No Session ID
            </div>
        );
    }

    // Fetch the dataset for this session
    const dataset = await prisma.dataset.findFirst({
        where: { sourceId: sessionId },
        include: { episodes: true }
    });

    if (!dataset) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                Dataset not found for this submission
            </div>
        );
    }

    // Default to first episode
    const episodeId = dataset.episodes[0]?.id;

    if (!episodeId) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                No episodes found in dataset
            </div>
        );
    }

    return (
        <ReviewInterface
            requestId={request.id}
            datasetId={dataset.id}
            episodes={dataset.episodes}
            initialStatus={request.status}
            requestPayload={payload}
            submittedBy={request.email}
            submittedAt={request.createdAt.toISOString()}
        />
    );
}
