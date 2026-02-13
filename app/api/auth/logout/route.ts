import { NextResponse } from 'next/server';
import { deleteSession } from '@/public/lib/auth-utils';

export async function POST() {
    try {
        await deleteSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}
