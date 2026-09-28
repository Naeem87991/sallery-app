import 'client-only';

import type { SecuritySettings } from '@/types/domain';

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;
const PBKDF2_ITERATIONS = 210_000;

export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin) || pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) return `Use a ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digit PIN.`;
  return null;
}

export async function createPinCredentials(pin: string): Promise<Pick<SecuritySettings, 'pinHash' | 'pinSalt'>> {
  const validationError = validatePin(pin);
  if (validationError) throw new Error(validationError);
  const salt = randomBytes(16);
  const pinHash = await hashPin(pin, salt);
  return { pinHash, pinSalt: bytesToBase64(salt) };
}

export async function verifyPin(pin: string, securitySettings: SecuritySettings): Promise<boolean> {
  if (!securitySettings.isPinEnabled || !securitySettings.pinHash || !securitySettings.pinSalt || validatePin(pin)) return false;
  const expected = base64ToBytes(securitySettings.pinHash);
  const actual = base64ToBytes(await hashPin(pin, base64ToBytes(securitySettings.pinSalt)));
  return timingsMatch(expected, actual);
}

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function timingsMatch(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function bytesToBase64(value: Uint8Array): string {
  let binary = '';
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}
