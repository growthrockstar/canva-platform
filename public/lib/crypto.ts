export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data: any, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16)).join(","); // Simple salt generation
    const key = await deriveKey(password, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedData
    );

    return {
        ciphertext: Buffer.from(encryptedContent).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
        salt: salt,
    };
}

export async function decryptData(encryptedData: string, ivStr: string, salt: string, password: string): Promise<any> {
    try {
        const key = await deriveKey(password, salt);
        const iv = Buffer.from(ivStr, "base64");
        const encryptedContent = Buffer.from(encryptedData, "base64");

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            encryptedContent
        );

        const decodedData = new TextDecoder().decode(decryptedContent);
        return JSON.parse(decodedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt data. Incorrect password or corrupted data.");
    }
}
