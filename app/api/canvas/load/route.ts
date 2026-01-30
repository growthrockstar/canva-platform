import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth-utils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const canvasId = searchParams.get('id');

        // Check Session
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.userId;

        // specific canvas fetch
        if (canvasId) {
            const canvas = await prisma.canvas.findUnique({
                where: { id: canvasId },
            });

            if (!canvas) {
                return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
            }

            // Simple authorization check
            if (canvas.userId !== userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            return NextResponse.json(canvas);
        }

        // Fetch latest canvas for user
        const latestCanvas = await prisma.canvas.findFirst({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ canvas: latestCanvas }); // Returns null if none found, which is fine

    } catch (error) {
        console.error('Error loading canvas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
