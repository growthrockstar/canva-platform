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

            // Fetch the latest canonical sections from the DB
            // This ensures that if we added new sections via seed/admin, they appear in the user's canvas
            // while preserving their existing data.
            const dbSections = await prisma.section.findMany({
                orderBy: { orderIndex: 'asc' }
            });

            // Merge logic:
            // 1. Iterate over the DB sections (the master list).
            // 2. If the user has a section with the same title, use the user's version (preserves widgets).
            // 3. If not, create a new empty section.
            const userSections: any[] = jsonData.syllabus_sections || [];

            const mergedSections = dbSections.map(dbSection => {
                const existing = userSections.find((us: any) => us.title === dbSection.title);
                if (existing) {
                    // Update ID to match DB just in case, but keep widgets and completion status
                    return {
                        ...existing,
                        id: dbSection.id
                    };
                } else {
                    // New section added in DB, missing in user data -> Initialize it
                    return {
                        id: dbSection.id,
                        title: dbSection.title,
                        is_completed: false,
                        widgets: []
                    };
                }
            });

            // Update the data we return with the merged sections
            jsonData.syllabus_sections = mergedSections;

            return NextResponse.json({
                canvas: {
                    ...canvas,
                    data: jsonData // Return the actual JSON object with merged sections
                }
            });
        } catch (decryptionError) {
            console.error("Decryption or Parse failed", decryptionError);

            // Fallback: Return a valid structure with EMPTY sections (fetched from DB to maintain structure)
            // so the user isn't locked out. We preserve what we can (Title, ID, timestamps)

            try {
                const defaultSections = await prisma.section.findMany({
                    orderBy: { orderIndex: 'asc' }
                });

                const fallbackSections = defaultSections.map(s => ({
                    id: s.id,
                    title: s.title,
                    is_completed: false,
                    widgets: []
                }));

                return NextResponse.json({
                    canvas: {
                        ...canvas,
                        data: {
                            project: {
                                title: canvas.title,
                            },
                            syllabus_sections: fallbackSections,
                            meta: {
                                version: '1.0',
                                last_modified: new Date().toISOString(),
                                theme: 'rockstar-default',
                                grid_columns: 1,
                            }
                        }
                    }
                });
            } catch (dbError) {
                console.error("Failed to fetch default sections for fallback", dbError);
                // Absolute worst case: return empty array
                return NextResponse.json({
                    canvas: {
                        ...canvas,
                        data: {
                            project: { title: canvas.title },
                            syllabus_sections: [],
                            meta: {
                                version: '1.0',
                                last_modified: new Date().toISOString(),
                                theme: 'rockstar-default',
                                grid_columns: 1,
                            }
                        }
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error loading canvas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

