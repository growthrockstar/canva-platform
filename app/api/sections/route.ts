import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sections = await prisma.section.findMany({
            orderBy: {
                orderIndex: 'asc',
            },
        });

        return NextResponse.json({ sections });
    } catch (error) {
        console.error("Error fetching sections:", error);
        return NextResponse.json(
            { error: "Failed to fetch sections" },
            { status: 500 }
        );
    }
}
