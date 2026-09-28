import 'client-only';

import { base64ToBytes, bytesToBase64, toArrayBuffer } from '@/lib/security/pin';

export function isPasskeyAvailable(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'PublicKeyCredential' in window && 'credentials' in navigator;
}

export async function createLocalPasskey(displayName: string): Promise<string> {
  if (!isPasskeyAvailable()) throw new Error('Passkeys need a secure browser connection and a compatible device.');
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: toArrayBuffer(randomBytes(32)),
      rp: { name: 'Live Salary Ticker' },
      user: { id: toArrayBuffer(randomBytes(16)), name: `local-${crypto.randomUUID()}`, displayName },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      timeout: 60_000,
      attestation: 'none',
    },
  });
  if (!(credential instanceof PublicKeyCredential)) throw new Error('No passkey was created.');
  return bytesToBase64(new Uint8Array(credential.rawId));
}

export async function verifyLocalPasskey(credentialId: string): Promise<boolean> {
  if (!isPasskeyAvailable()) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: toArrayBuffer(randomBytes(32)),
        allowCredentials: [{ type: 'public-key', id: toArrayBuffer(base64ToBytes(credentialId)) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return assertion instanceof PublicKeyCredential;
  } catch {
    return false;
  }
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
