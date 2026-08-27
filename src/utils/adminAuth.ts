/**
 * Admin authorization utilities for PokéCount Tracker.
 * Supports Google OAuth email allowlist & secret passkey fallback.
 */

export function getAdminEmails(): string[] {
  const envEmails = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.trim();
  if (!envEmails) return ['wingae911@gmail.com'];
  return envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}

export function verifyAdminPasskey(passkey: string): boolean {
  const envPasskey = (import.meta.env.VITE_ADMIN_PASSKEY as string | undefined)?.trim();
  const defaultKey = 'poke911admin';
  if (envPasskey) {
    return passkey.trim() === envPasskey;
  }
  return passkey.trim() === defaultKey;
}
