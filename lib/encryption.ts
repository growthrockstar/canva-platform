import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// In production, this MUST be set in environment variables and be 32 chars long
// For development, we fallback to a default (unsafe for prod)
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'growth_rockstar_canvas_secret_32';

export function encrypt(text: string) {
  // Generate random IV and Salt
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(64);
  
  // Derive a strong key from the secret and salt
  // pbkdf2Sync(password, salt, iterations, keylen, digest)
  const key = crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex')
  };
}

export function decrypt(encryptedData: string, ivHex: string, saltHex: string) {
  const iv = Buffer.from(ivHex, 'hex');
  const salt = Buffer.from(saltHex, 'hex');
  
  // Re-derive the key using the stored salt
  const key = crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
