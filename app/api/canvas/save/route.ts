import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { canvasId, data, iv, salt, userId } = body;

        // TODO: Add proper authentication check here when auth is implemented.
        // For now we assume userId is passed from client (THIS IS INSECURE but matches current state).
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: No userId provided' }, { status: 401 });
        }

        if (!canvasId || !data || !iv || !salt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedCanvas = await prisma.canvas.upsert({
            where: { id: canvasId },
            update: {
                data,
                iv,
                salt,
                updatedAt: new Date(),
            },
            create: {
                id: canvasId,
                title: 'My Growth Canvas', // Default title, maybe pass this too
                data,
                iv,
                salt,
                userId: userId,
            },
        });

        return NextResponse.json({ success: true, canvas: updatedCanvas });
    } catch (error) {
        console.error('Error saving canvas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
