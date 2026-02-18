const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com';

    // Create user
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Test Teleoperator',
        },
    });

    // Assign teleoperator role
    await prisma.userRole.upsert({
        where: {
            userId_role: {
                userId: user.id,
                role: 'teleoperator'
            }
        },
        update: {},
        create: {
            userId: user.id,
            role: 'teleoperator',
        },
    });

    console.log(`Created test user: ${user.email} with ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
