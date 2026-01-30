import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth-utils';
import { decrypt } from '@/lib/encryption';

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

        let canvas;

        if (canvasId) {
            canvas = await prisma.canvas.findUnique({
                where: { id: canvasId },
            });

            if (!canvas) {
                return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
            }

            if (canvas.userId !== userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else {
            // Fetch latest
            canvas = await prisma.canvas.findFirst({
                where: { userId: userId },
                orderBy: { updatedAt: 'desc' }
            });
        }

        if (!canvas) {
            return NextResponse.json({ canvas: null });
        }

        // Decrypt data
        try {
            const decryptedString = decrypt(canvas.data, canvas.iv, canvas.salt);
            const jsonData = JSON.parse(decryptedString);

            return NextResponse.json({
                canvas: {
                    ...canvas,
                    data: jsonData // Return the actual JSON object
                }
            });
        } catch (decryptionError) {
            console.error("Decryption failed", decryptionError);
            return NextResponse.json({ error: 'Failed to decrypt canvas data' }, { status: 500 });
        }

    } catch (error) {
        console.error('Error loading canvas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

