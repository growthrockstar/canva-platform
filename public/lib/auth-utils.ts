import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me-in-prod');
const ALG = 'HS256';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return token;
}

export async function verifySession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            algorithms: [ALG],
        });
        return payload as { userId: string };
    } catch (error) {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
