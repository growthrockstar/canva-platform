import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth-utils';
import { encrypt } from '@/lib/encryption';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { canvasId, data, title } = body;

        // Check Session
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.userId;

        if (!data) {
            return NextResponse.json({ error: 'Missing canvas data' }, { status: 400 });
        }

        // Encrypt the data server-side
        const jsonString = JSON.stringify(data);
        const { encryptedData, iv, salt } = encrypt(jsonString);

        let savedCanvas;

        if (canvasId) {
            // Try to update existing with provided ID
            savedCanvas = await prisma.canvas.upsert({
                where: { id: canvasId },
                update: {
                    data: encryptedData,
                    iv,
                    salt,
                    title: title || undefined,
                    updatedAt: new Date(),
                },
                create: {
                    id: canvasId, 
                    title: title || 'Growth Rockstar Strategy',
                    data: encryptedData,
                    iv,
                    salt,
                    userId: userId,
                },
            });
        } else {
            // No ID provided. 
            // SMART LOGIC: Check if user already has a canvas. If so, update the latest one.
            // This prevents duplicate creation when frontend loses state (e.g. fresh browser) but user has data.
            
            const existingCanvas = await prisma.canvas.findFirst({
                where: { userId: userId },
                orderBy: { updatedAt: 'desc' }
            });

            if (existingCanvas) {
                // Update the existing one
                savedCanvas = await prisma.canvas.update({
                    where: { id: existingCanvas.id },
                    data: {
                        data: encryptedData,
                        iv,
                        salt,
                        title: title || undefined,
                        updatedAt: new Date(),
                    }
                });
            } else {
                // Really create new
                savedCanvas = await prisma.canvas.create({
                    data: {
                        title: title || 'Growth Rockstar Strategy',
                        data: encryptedData,
                        iv,
                        salt,
                        userId: userId,
                    }
                });
            }
        }

        return NextResponse.json({ success: true, canvas: savedCanvas });
    } catch (error) {
        console.error('Error saving canvas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

