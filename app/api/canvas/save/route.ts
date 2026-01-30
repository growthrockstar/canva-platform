import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth-utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { canvasId, data, iv, salt } = body;

        // Check Session
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.userId;

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
