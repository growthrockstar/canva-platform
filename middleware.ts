import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me-in-prod');

export async function middleware(request: NextRequest) {
    // Protect /canvas and /new routes
    if (request.nextUrl.pathname.startsWith('/canvas') || request.nextUrl.pathname.startsWith('/new')) {
        const session = request.cookies.get('session')?.value;

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            await jwtVerify(session, JWT_SECRET, { algorithms: ['HS256'] });
            return NextResponse.next();
        } catch (error) {
            console.error('Session verification failed', error);
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/canvas/:path*', '/new/:path*'],
};
