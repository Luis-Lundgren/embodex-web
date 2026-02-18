const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const episodeId = '1d28cf4a-8cea-44f1-bb61-10126c29b5dd'; // From previous output

    console.log(`Checking database for Episode ID: ${episodeId}...`);

    const episode = await prisma.episode.findUnique({
        where: { id: episodeId },
        include: { dataset: true }
    });

    if (!episode) {
        console.error("Episode not found in database!");
        process.exit(1);
    }

    console.log("SUCCESS! Found record in database.");
    console.log("Dataset Title:", episode.dataset.title);
    console.log("Episode Data (first few timestamps):", episode.data.timestamps.slice(0, 3));
    console.log("Frame Count:", episode.frameCount);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
