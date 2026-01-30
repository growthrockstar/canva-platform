import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const sections = [
        { title: 'FUNDAMENTOS Y RETENCIÓN', orderIndex: 0 },
        { title: 'ADQUISICIÓN', orderIndex: 1 },
        { title: 'ACTIVACIÓN', orderIndex: 2 },
        { title: 'REVENUE & MONETIZACIÓN', orderIndex: 3 },
        { title: 'REFERRAL & LOOPS', orderIndex: 4 },
    ]

    console.log('Start seeding sections...')

    for (const section of sections) {
        const exists = await prisma.section.findFirst({
            where: { title: section.title }
        })

        if (!exists) {
            await prisma.section.create({
                data: section
            })
            console.log(`Created section: ${section.title}`)
        } else {
            console.log(`Section already exists: ${section.title}`)
        }
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
